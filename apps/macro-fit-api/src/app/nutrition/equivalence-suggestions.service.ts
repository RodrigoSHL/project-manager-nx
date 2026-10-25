import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  EquivalenceSuggestionRequest,
  ProductSuggestionRequest,
  EquivalenceSuggestions,
  NutritionPlan,
  PautaRule,
} from '@project-manager/macrofit-contracts';
import { NutritionService } from './nutrition.service';
import { PlateAnalysisService } from '../plate-analysis/plate-analysis.service';
import {
  EquivalenceProposalFood,
  equivalenceProposalSchema,
} from '../plate-analysis/dto/equivalence-proposal.dto';
import { condimentReference } from './equivalence-reference';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const tokens = (value: string, brand = '') =>
  normalize(value)
    .replace(/\ben (aceite|agua)\b/g, '')
    .split(' ')
    .filter(
      (word) =>
        word.length > 2 &&
        !normalize(brand).split(' ').includes(word) &&
        ![
          'con',
          'sin',
          'para',
          'del',
          'las',
          'los',
          'una',
          'por',
          'marca',
          'producto',
          'cocido',
          'cocidos',
          'cocida',
          'cocidas',
          'crudo',
          'cruda',
          'crudos',
          'crudas',
          'natural',
          'lata',
          'conserva',
          'escurrido',
          'azucar',
          'entero',
          'entera',
          'descremado',
          'descremada',
        ].includes(word)
    )
    .map((word) => word.replace(/s$/, ''));
// Explicitly incompatible preparations cannot be proposed even by the model.
const incompatible = (a: string, b: string) =>
  [
    [/\bcrud[oa]s?\b/, /\bcocid[oa]s?\b/],
    [/\ben agua\b/, /\ben aceite\b/],
    [/\bsin azucar\b/, /\b(con azucar|azucarado)\b/],
    [/\b(descremad[oa]|desnatad[oa])\b/, /\benter[oa]\b/],
  ].some(
    ([left, right]) =>
      (left.test(normalize(a)) && right.test(normalize(b))) ||
      (right.test(normalize(a)) && left.test(normalize(b)))
  );

type Reference = {
  key: string;
  origin: 'day' | 'catalog';
  rule: PautaRule;
  exact: boolean;
  score: number;
};
export function relatedReferences(
  food: { id: string; name: string; brand?: string },
  day: NutritionPlan,
  catalog?: NutritionPlan
): Reference[] {
  const references: Reference[] = [];
  for (const [origin, plan] of [
    ['day', day],
    ['catalog', catalog],
  ] as const) {
    for (const [index, rule] of (plan?.rules ?? []).entries()) {
      if (
        origin === 'catalog' &&
        day.rules.some(
          (existing) => JSON.stringify(existing) === JSON.stringify(rule)
        )
      )
        continue;
      const names = [rule.name, ...rule.aliases];
      const exact =
        rule.foodIds.includes(food.id) ||
        names.some((name) => normalize(name) === normalize(food.name));
      const overlap = Math.max(
        0,
        ...names
          .filter((name) => !incompatible(food.name, name))
          .map((name) => {
            const shared = tokens(food.name, food.brand).filter((word) =>
              tokens(name).includes(word)
            );
            return (
              shared.length /
              Math.max(
                1,
                tokens(food.name, food.brand).length,
                tokens(name).length
              )
            );
          })
      );
      // Free is a rule in the user's plan, never a conclusion from low calories.
      if (
        (!exact && rule.free) ||
        (!exact && overlap === 0) ||
        incompatible(food.name, rule.name)
      )
        continue;
      references.push({
        key: `${origin}:${index}`,
        origin,
        rule,
        exact,
        score: exact ? 2 : overlap,
      });
    }
  }
  return references
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .slice(0, 20);
}

@Injectable()
export class EquivalenceSuggestionsService {
  constructor(
    private readonly nutrition: NutritionService,
    private readonly analysis: PlateAnalysisService
  ) {}

  async suggest(
    userId: string,
    date: string,
    mealId: string,
    input: EquivalenceSuggestionRequest
  ): Promise<EquivalenceSuggestions> {
    const context = await this.nutrition.getEquivalenceContext(
      userId,
      date,
      mealId,
      input
    );
    return this.resolve(
      { ...context.food, preparation: input.preparation },
      context.day,
      context.catalog,
      {
        mealId,
        productId: input.productId ?? null,
        dayPlanVersion: context.day.version,
        catalogPlanVersion: context.catalog.version,
      },
      input.useAi,
      input.mode
    );
  }
  async suggestProduct(
    userId: string,
    productId: string,
    input: ProductSuggestionRequest
  ): Promise<EquivalenceSuggestions> {
    const context = await this.nutrition.getProductEquivalenceContext(
      userId,
      productId,
      input
    );
    const basis = {
      mealId: null,
      productId,
      dayPlanVersion: null,
      catalogPlanVersion: context.plan?.version ?? null,
    };
    if (!context.plan?.enabled)
      return {
        status: 'insufficient',
        source: 'saved',
        basis,
        suggestions: [],
        message:
          'Tu producto ya tiene sus nutrientes guardados. Su equivalencia queda pendiente.',
        missingInfo: [
          'Configura o activa tu pauta para comparar sus referencias. Luego podrás volver a este producto y pedir sugerencias, incluida la ayuda de IA.',
        ],
      };
    return this.resolve(
      context.food,
      { ...context.plan, rules: [] },
      context.plan,
      basis,
      input.useAi,
      input.mode
    );
  }
  private async resolve(
    food: EquivalenceProposalFood,
    day: NutritionPlan,
    catalog: NutritionPlan | undefined,
    basis: EquivalenceSuggestions['basis'],
    useAi: boolean,
    mode?: 'compare' | 'estimate'
  ): Promise<EquivalenceSuggestions> {
    const references = relatedReferences(food, day, catalog);
    const insufficient = (
      source: 'saved' | 'ai',
      missingInfo: string[]
    ): EquivalenceSuggestions => ({
      status: 'insufficient',
      source,
      basis,
      suggestions: [],
      message: basis.mealId
        ? 'No hay una equivalencia respaldada para este alimento. Sus nutrientes se siguen contando.'
        : 'La ficha nutricional está guardada; falta una referencia de porciones para este producto.',
      missingInfo: missingInfo.length
        ? missingInfo
        : [
            `Falta una referencia de tu pauta para ${food.name}: cantidad, unidad y porciones, o una indicación explícita de que es libre. Puedes dejarlo pendiente y completar esa referencia después.`,
          ],
    });
    if (
      (basis.productId || basis.mealId) &&
      !references.some((reference) => reference.exact)
    ) {
      const reference = condimentReference(food);
      if (reference)
        return {
          status: 'suggestions',
          source: 'reference',
          basis,
          suggestions: [reference],
          missingInfo: [],
          message:
            'Encontramos una propuesta en una referencia general. No pertenece a tu pauta: revisa el fundamento antes de incorporarla.',
        };
    }
    if (useAi && (mode === 'estimate' || !references.length)) {
      return this.propose(food, catalog ?? day, basis, insufficient);
    }
    if (!references.length)
      return insufficient('saved', [
        `No hay una equivalencia guardada para ${food.name}. Puedes pedir una propuesta con IA usando su ficha nutricional, o completar una referencia manualmente.`,
      ]);
    const asSuggestion = (
      ref: Reference
    ): EquivalenceSuggestions['suggestions'][number] => ({
      key: ref.key,
      origin: ref.origin,
      rule: ref.rule,
      match: ref.exact ? 'exact' : 'related',
      confidence: ref.exact ? 'high' : 'medium',
      explanation: ref.exact
        ? 'Coincide con un identificador, nombre o alias guardado en tu pauta.'
        : 'Comparte parte del nombre con esta referencia guardada. Es una opción para revisar, no una equivalencia confirmada.',
      uncertainty: ref.exact
        ? 'Comprueba que corresponda al mismo producto, preparación y unidad.'
        : 'Verifica alimento, marca, preparación y cantidad antes de copiar sus porciones. Los macros del producto no definen estas porciones.',
    });
    let suggestions = references.slice(0, 5).map(asSuggestion);
    if (useAi) {
      const ranking = await this.analysis.rankEquivalences({
        food: {
          name: food.name,
          ...('brand' in food && food.brand ? { brand: food.brand } : {}),
        },
        references: references.map((ref) => ({
          key: ref.key,
          name: ref.rule.name,
          aliases: ref.rule.aliases.slice(0, 8),
          unit: ref.rule.unit,
          free: ref.rule.free,
        })),
      });
      suggestions = ranking.candidates.map((candidate) => {
        const ref = references.find((item) => item.key === candidate.key);
        if (!ref)
          throw new BadGatewayException(
            'La IA seleccionó una referencia inválida. No se aplicó ninguna equivalencia.'
          );
        return {
          ...asSuggestion(ref),
          match: 'ai',
          confidence: candidate.confidence,
          explanation: candidate.explanation,
          uncertainty: candidate.uncertainty,
        };
      });
      if (!suggestions.length) return insufficient('ai', ranking.missingInfo);
    }
    return {
      status: 'suggestions',
      source: useAi ? 'ai' : 'saved',
      basis,
      message:
        'Revisa la referencia y aplícala al formulario. Nada se guarda hasta que lo confirmes.',
      missingInfo: [],
      suggestions,
    };
  }

  private async propose(
    food: EquivalenceProposalFood,
    plan: NutritionPlan,
    basis: EquivalenceSuggestions['basis'],
    insufficient: (
      source: 'saved' | 'ai',
      missingInfo: string[]
    ) => EquivalenceSuggestions
  ): Promise<EquivalenceSuggestions> {
    if (
      !food.servingSizeGrams ||
      ![food.calories, food.protein, food.carbs, food.fat].every(
        (value) =>
          typeof value === 'number' && Number.isFinite(value) && value >= 0
      )
    )
      return insufficient('saved', [
        basis.productId
          ? 'Completa en Mis productos la cantidad, unidad, calorías y macros de la ficha antes de pedir una propuesta.'
          : 'Revisa la cantidad, unidad, calorías y macros del consumo antes de pedir una propuesta.',
      ]);
    // Balance the bounded context across groups; the first 40 rows alone can all
    // belong to the same section of a large imported plan.
    const selected = new Map<string, PautaRule>();
    for (const ref of relatedReferences(food, plan))
      selected.set(ref.rule.id, ref.rule);
    for (const group of Object.keys(plan.targets)) {
      for (const rule of plan.rules
        .filter((rule) =>
          rule.contributions.some((item) => item.group === group)
        )
        .slice(0, 6))
        selected.set(rule.id, rule);
    }
    const result = equivalenceProposalSchema.parse(
      await this.analysis.proposeEquivalence({
        source: basis.productId ? 'product' : 'recorded-meal',
        food: {
          name: food.name,
          ...(food.brand ? { brand: food.brand } : {}),
          ...(food.preparation ? { preparation: food.preparation } : {}),
          servingSizeGrams: food.servingSizeGrams,
          quantityUnit: food.quantityUnit ?? 'g',
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        },
        targets: plan.targets,
        references: [...selected.values()].slice(0, 48).map((rule) => ({
          name: rule.name,
          referenceAmount: rule.referenceAmount,
          unit: rule.unit,
          contributions: rule.contributions,
          free: rule.free,
        })),
      })
    );
    if (!result.proposal) return insufficient('ai', result.missingInfo);
    const proposal = result.proposal;
    if (proposal.free)
      throw new BadGatewayException(
        'La IA propuso no sumar porciones sin una referencia que lo respalde. No se aplicó la propuesta. Puedes buscar una referencia de tu pauta o volver a solicitarla.'
      );
    // The label base (e.g. 100 g) and the exchange reference (e.g. 15 g)
    // serve different purposes. Changing amount within one unit is valid;
    // changing units would require a conversion the product does not declare.
    if (proposal.unit !== (food.quantityUnit ?? 'g'))
      throw new BadGatewayException(
        `La IA propuso una referencia en ${
          proposal.unit
        }, pero la ficha está en ${
          food.quantityUnit ?? 'g'
        }. Falta una conversión explícita entre esas unidades. No se aplicó la propuesta; vuelve a solicitarla usando la unidad de la ficha.`
      );
    return {
      status: 'suggestions',
      source: 'ai',
      basis,
      missingInfo: result.missingInfo,
      message:
        'La IA propone una equivalencia nueva. Es orientativa y no forma parte de tu pauta hasta que revises y confirmes su guardado.',
      suggestions: [
        {
          key: 'estimate:product',
          origin: 'estimate',
          match: 'estimated',
          confidence: proposal.confidence,
          explanation: proposal.explanation,
          uncertainty: proposal.uncertainty,
          evidence: {
            method: 'model',
            assumptions: proposal.assumptions,
            sources: [],
          },
          rule: {
            id: 'proposed-product',
            name: food.name,
            foodIds: [food.id],
            aliases: [],
            referenceAmount: proposal.referenceAmount,
            unit: proposal.unit,
            free: false,
            contributions: proposal.contributions,
            notes: `Propuesta orientativa de IA, aceptada por el usuario; no incluida en la pauta original. Sin fuente externa verificada. ${proposal.explanation.slice(
              0,
              600
            )} Incertidumbre: ${proposal.uncertainty.slice(
              0,
              500
            )} Supuestos: ${proposal.assumptions.join(' ').slice(0, 650)}`,
          },
        },
      ],
    };
  }
}
