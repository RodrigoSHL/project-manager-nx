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
    );
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
      context.food,
      context.day,
      input.productId ? context.catalog : undefined,
      {
        mealId,
        productId: input.productId ?? null,
        dayPlanVersion: context.day.version,
        catalogPlanVersion: context.catalog.version,
      },
      input.useAi
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
      input.useAi
    );
  }
  private async resolve(
    food: { id: string; name: string; brand?: string },
    day: NutritionPlan,
    catalog: NutritionPlan | undefined,
    basis: EquivalenceSuggestions['basis'],
    useAi: boolean
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
    if (!references.length) return insufficient('saved', []);
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
}
