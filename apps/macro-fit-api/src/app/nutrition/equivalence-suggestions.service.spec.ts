import {
  NutritionPlan,
  PautaRule,
  equivalenceSuggestionsSchema,
  calculatePauta,
} from '@project-manager/macrofit-contracts';
import {
  EquivalenceSuggestionsService,
  relatedReferences,
} from './equivalence-suggestions.service';
import { NutritionService } from './nutrition.service';
import { PlateAnalysisService } from '../plate-analysis/plate-analysis.service';

const rule = (name: string, extra: Partial<PautaRule> = {}): PautaRule => ({
  id: name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-'),
  name,
  foodIds: [],
  aliases: [],
  referenceAmount: 60,
  unit: 'g',
  contributions: [{ group: 'protein', portions: 1 }],
  free: false,
  notes: '',
  ...extra,
});
const plan = (rules: PautaRule[], version = 1): NutritionPlan => ({
  name: 'Mi pauta',
  rules,
  version,
  createdAt: '2026-10-23T00:00:00.000Z',
  enabled: true,
  startsOn: '2026-10-23',
  targets: {
    protein: 10,
    carbs: 4,
    fats: 2,
    dairy: 3,
    fruits: 3,
    veggies: null,
    supplements: 0,
  },
  waterTargetMl: 2000,
  waterIsMinimum: false,
});

describe('Grounded equivalence suggestions', () => {
  const rankEquivalences = jest.fn();
  const proposeEquivalence = jest.fn();
  const getEquivalenceContext = jest.fn();
  const getProductEquivalenceContext = jest.fn();
  const service = new EquivalenceSuggestionsService(
    {
      getEquivalenceContext,
      getProductEquivalenceContext,
    } as unknown as NutritionService,
    { rankEquivalences, proposeEquivalence } as unknown as PlateAnalysisService
  );
  const request = {
    dayPlanVersion: 1,
    catalogPlanVersion: 2,
    productId: 'tuna',
    useAi: false,
  };
  const tuna = rule('Atún en agua', {
    aliases: ['Atún al agua'],
    notes: 'Pesado escurrido.',
  });
  beforeEach(() => {
    jest.resetAllMocks();
    getEquivalenceContext.mockResolvedValue({
      food: { id: 'tuna', name: 'ATUN al agua' },
      day: plan([tuna]),
      catalog: plan([tuna], 2),
    });
  });
  it('suggests account references directly for an owned product without requiring a meal', async () => {
    getProductEquivalenceContext.mockResolvedValue({
      food: { id: 'tuna', name: 'ATUN al agua' },
      plan: plan([tuna], 2),
    });
    const result = await service.suggestProduct('owner', 'tuna', {
      catalogPlanVersion: 2,
      useAi: false,
    });
    expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    expect(result.basis).toEqual({
      mealId: null,
      productId: 'tuna',
      dayPlanVersion: null,
      catalogPlanVersion: 2,
    });
    expect(result.suggestions[0]).toMatchObject({
      origin: 'catalog',
      match: 'exact',
      rule: tuna,
    });
  });
  it('keeps an unconfigured product pending without consulting AI when there is no active plan', async () => {
    for (const configured of [null, { ...plan([tuna]), enabled: false }]) {
      getProductEquivalenceContext.mockResolvedValue({
        food: { id: 'tuna', name: 'Atún' },
        plan: configured,
      });
      const result = await service.suggestProduct('owner', 'tuna', {
        catalogPlanVersion: configured?.version ?? null,
        useAi: true,
      });
      expect(result).toMatchObject({
        status: 'insufficient',
        source: 'saved',
        suggestions: [],
      });
      expect(result.missingInfo[0]).toContain('Configura o activa');
      expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    }
    expect(rankEquivalences).not.toHaveBeenCalled();
  });
  it('ranks accent-insensitive exact names ahead of related names, preserving the original numeric rule', async () => {
    const result = await service.suggest(
      'owner',
      '2026-10-23',
      'meal',
      request
    );
    expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    expect(result.suggestions[0]).toMatchObject({
      origin: 'day',
      match: 'exact',
      confidence: 'high',
      rule: tuna,
    });
    expect(result.suggestions[0].rule).toBe(tuna);
    expect(rankEquivalences).not.toHaveBeenCalled();
  });
  it('requires a complete product label before proposing a new equivalence, without assuming that mustard is free from its name alone', async () => {
    getEquivalenceContext.mockResolvedValue({
      food: { id: 'mustard', name: 'Mostaza Heinz', brand: 'Heinz' },
      day: plan([
        rule('Verduras libres', { free: true, contributions: [] }),
        rule('Aceite de oliva'),
        rule('Atún Heinz'),
      ]),
      catalog: plan([], 2),
    });
    const result = await service.suggest('owner', '2026-10-23', 'meal', {
      ...request,
      productId: 'mustard',
      useAi: true,
    });
    expect(result).toMatchObject({
      status: 'insufficient',
      source: 'saved',
      suggestions: [],
    });
    expect(result.missingInfo[0]).toContain('Completa en Mis productos');
    expect(rankEquivalences).not.toHaveBeenCalled();
    expect(proposeEquivalence).not.toHaveBeenCalled();
  });

  const mustard = {
    id: 'mustard',
    name: 'Mostaza Heinz',
    brand: 'Heinz',
    servingSizeGrams: 100,
    quantityUnit: 'g',
    calories: 54.2,
    protein: 3.5,
    carbs: 6,
    fat: 1.8,
  };
  it('offers a sourced, explicitly provisional condiment rule without changing the plan or calling Gemini', async () => {
    const catalog = plan([tuna], 2);
    getEquivalenceContext.mockResolvedValue({
      food: mustard,
      day: plan([tuna]),
      catalog,
    });
    const result = await service.suggest('owner', '2026-10-23', 'meal', {
      ...request,
      productId: mustard.id,
    });
    expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    expect(result).toMatchObject({
      source: 'reference',
      status: 'suggestions',
    });
    expect(result.suggestions[0]).toMatchObject({
      origin: 'estimate',
      match: 'estimated',
      confidence: 'medium',
      rule: { referenceAmount: 100, unit: 'g', free: true, contributions: [] },
      evidence: {
        method: 'reference',
        sources: [{ url: expect.stringContaining('uclahealth.org') }],
      },
    });
    expect(result.suggestions[0].rule.notes).toContain(
      'No incluida en la pauta original'
    );
    expect(catalog.rules).toEqual([tuna]);
    expect(rankEquivalences).not.toHaveBeenCalled();
    expect(proposeEquivalence).not.toHaveBeenCalled();
  });
  it.each([
    { name: 'Mostaza con miel' },
    { name: 'Mayonesa con mostaza' },
    { name: 'Semillas de mostaza' },
    { calories: 300, fat: 25 },
    { quantityUnit: 'ml' },
  ])(
    'does not apply the plain-mustard reference to a different identity or incompatible label: %o',
    async (change) => {
      getProductEquivalenceContext.mockResolvedValue({
        food: { ...mustard, ...change },
        plan: plan([tuna], 2),
      });
      const result = await service.suggestProduct('owner', mustard.id, {
        catalogPlanVersion: 2,
        useAi: false,
      });
      expect(result.status).toBe('insufficient');
      expect(result.suggestions).toHaveLength(0);
    }
  );
  const estimate = {
    proposal: {
      referenceAmount: 100,
      unit: 'g',
      free: false,
      contributions: [{ group: 'dairy', portions: 0.8 }],
      confidence: 'low',
      explanation:
        'Estimación de intercambio lácteo; 100 g se aproximan a 0,8 de una referencia de yogur.',
      uncertainty: 'La fórmula y la porción de tu pauta pueden diferir.',
      assumptions: ['Confirma que sea yogur lácteo, no una bebida vegetal.'],
    },
    missingInfo: [],
  };
  it('proposes a genuinely new numeric rule from product facts when no named reference exists, without sending private data or claiming external sources', async () => {
    getProductEquivalenceContext.mockResolvedValue({
      food: {
        ...mustard,
        id: 'yogurt',
        name: 'Yogur especial',
        brand: 'Marca',
        barcode: '12345678',
        notes: 'private-note',
      },
      plan: plan([tuna], 2),
    });
    proposeEquivalence.mockResolvedValue(estimate);
    const result = await service.suggestProduct('owner', 'yogurt', {
      catalogPlanVersion: 2,
      useAi: true,
      mode: 'estimate',
    });
    expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    expect(result.suggestions[0]).toMatchObject({
      origin: 'estimate',
      match: 'estimated',
      rule: {
        free: false,
        referenceAmount: 100,
        contributions: estimate.proposal.contributions,
      },
      evidence: {
        method: 'model',
        sources: [],
        assumptions: estimate.proposal.assumptions,
      },
    });
    expect(result.suggestions[0].rule.notes).toContain(
      'Sin fuente externa verificada'
    );
    const payload = proposeEquivalence.mock.calls[0][0];
    expect(payload.food).toMatchObject({
      servingSizeGrams: 100,
      quantityUnit: 'g',
      protein: 3.5,
    });
    expect(payload.references[0]).toMatchObject({
      referenceAmount: 60,
      contributions: tuna.contributions,
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /owner|12345678|private-note|yogurt/
    );
    expect(rankEquivalences).not.toHaveBeenCalled();
  });
  it('accepts a mayonnaise exchange reference in 15 g when the label is per 100 g and scales consumption using that proposed amount', async () => {
    const mayonnaise = {
      ...mustard,
      id: 'mayo',
      name: 'Mayonesa Kraft',
      brand: 'Kraft',
      calories: 707.69,
      protein: 0.76,
      carbs: 2.3,
      fat: 76.92,
    };
    getProductEquivalenceContext.mockResolvedValue({
      food: mayonnaise,
      plan: plan([tuna], 2),
    });
    // Synthetic portions test reference scaling, not a dietary recommendation.
    proposeEquivalence.mockResolvedValue({
      ...estimate,
      proposal: {
        ...estimate.proposal,
        referenceAmount: 15,
        contributions: [{ group: 'fats', portions: 0.5 }],
        explanation:
          'Referencia de prueba por 15 g, distinta de la etiqueta por 100 g.',
      },
    });
    const result = await service.suggestProduct('owner', 'mayo', {
      catalogPlanVersion: 2,
      useAi: true,
      mode: 'estimate',
    });
    expect(equivalenceSuggestionsSchema.safeParse(result).success).toBe(true);
    const rule = result.suggestions[0].rule;
    expect(rule).toMatchObject({ unit: 'g', referenceAmount: 15, free: false });
    expect(proposeEquivalence.mock.calls[0][0].food).toMatchObject({
      servingSizeGrams: 100,
      fat: 76.92,
    });
    expect(
      calculatePauta(
        plan([rule]),
        { foodId: mayonnaise.id, foodName: mayonnaise.name, amountGrams: 30 },
        { ruleId: rule.id }
      )
    ).toMatchObject({
      status: 'matched',
      contributions: [{ group: 'fats', portions: 1 }],
    });
  });
  it.each([
    [{ unit: 'ml' }, 'Falta una conversión explícita'],
    [{ free: true, contributions: [] }, 'sin una referencia que lo respalde'],
  ])(
    'rejects an invented conversion or an ungrounded free proposal: %o',
    async (change, message) => {
      getProductEquivalenceContext.mockResolvedValue({
        food: { ...mustard, name: 'Yogur' },
        plan: plan([tuna], 2),
      });
      proposeEquivalence.mockResolvedValue({
        ...estimate,
        proposal: { ...estimate.proposal, ...change },
      });
      await expect(
        service.suggestProduct('owner', 'yogurt', {
          catalogPlanVersion: 2,
          useAi: true,
          mode: 'estimate',
        })
      ).rejects.toMatchObject({
        status: 502,
        message: expect.stringContaining(message),
      });
    }
  );
  it('exposes provider failure and insufficient evidence rather than producing a fictional equivalence', async () => {
    getProductEquivalenceContext.mockResolvedValue({
      food: { ...mustard, name: 'Producto desconocido' },
      plan: plan([tuna], 2),
    });
    proposeEquivalence.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(
      service.suggestProduct('owner', 'unknown', {
        catalogPlanVersion: 2,
        useAi: true,
      })
    ).rejects.toThrow('Provider unavailable');
    proposeEquivalence.mockResolvedValueOnce({
      proposal: null,
      missingInfo: ['Confirma ingredientes y preparación.'],
    });
    expect(
      await service.suggestProduct('owner', 'unknown', {
        catalogPlanVersion: 2,
        useAi: true,
      })
    ).toMatchObject({
      status: 'insufficient',
      source: 'ai',
      suggestions: [],
      missingInfo: ['Confirma ingredientes y preparación.'],
    });
  });
  it('allows an explicitly named free rule but never a related free food', () => {
    const free = rule('Mostaza Heinz', { free: true, contributions: [] });
    expect(
      relatedReferences({ id: 'mustard', name: 'Mostaza Heinz' }, plan([free]))
    ).toHaveLength(1);
    expect(
      relatedReferences(
        { id: 'mustard', name: 'Mostaza de otra marca' },
        plan([free])
      )
    ).toHaveLength(0);
  });
  it.each([
    ['Arroz crudo', 'Arroz cocido'],
    ['Pechuga cruda', 'Pechuga cocida'],
    ['Atún en aceite', 'Atún en agua'],
    ['Yogur con azúcar', 'Yogur sin azúcar'],
    ['Leche entera', 'Leche descremada'],
    ['Arroz cocido', 'Pollo cocido'],
  ])(
    'rejects incompatible or unrelated preparations: %s / %s',
    (name, candidate) => {
      expect(
        relatedReferences({ id: 'food', name }, plan([rule(candidate)]))
      ).toHaveLength(0);
    }
  );
  it('includes distinct account rules with their origin and removes identical references', () => {
    const own = rule('Atún marca propia', { referenceAmount: 120 });
    const refs = relatedReferences(
      { id: 'tuna', name: 'Atún' },
      plan([tuna]),
      plan([tuna, own], 2)
    );
    expect(refs).toHaveLength(2);
    expect(refs.find((item) => item.rule === own)?.origin).toBe('catalog');
  });
  it('only sends names of eligible references and copies stored amounts after the AI ranks keys', async () => {
    rankEquivalences.mockResolvedValue({
      candidates: [
        {
          key: 'day:0',
          confidence: 'medium',
          explanation: 'Coincide el alimento.',
          uncertainty: 'Revisa la marca y el escurrido.',
        },
      ],
      missingInfo: [],
    });
    const result = await service.suggest('owner', '2026-10-23', 'meal', {
      ...request,
      useAi: true,
    });
    expect(result.suggestions[0]).toMatchObject({
      match: 'ai',
      confidence: 'medium',
      rule: tuna,
    });
    const payload = rankEquivalences.mock.calls[0][0];
    expect(payload).toEqual({
      food: { name: 'ATUN al agua' },
      references: [
        {
          key: 'day:0',
          name: tuna.name,
          aliases: tuna.aliases,
          unit: 'g',
          free: false,
        },
      ],
    });
    expect(JSON.stringify(payload)).not.toContain('owner');
    expect(JSON.stringify(payload)).not.toContain('Pesado escurrido');
  });
  it('does not hide an invalid AI key or a provider failure behind successful suggestions', async () => {
    rankEquivalences.mockResolvedValueOnce({
      candidates: [
        {
          key: 'invented',
          confidence: 'medium',
          explanation: 'x',
          uncertainty: 'x',
        },
      ],
      missingInfo: [],
    });
    await expect(
      service.suggest('owner', '2026-10-23', 'meal', {
        ...request,
        useAi: true,
      })
    ).rejects.toMatchObject({ status: 502 });
    rankEquivalences.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(
      service.suggest('owner', '2026-10-23', 'meal', {
        ...request,
        useAi: true,
      })
    ).rejects.toThrow('Provider unavailable');
  });
  it('accepts that AI found no adequate reference without inventing a replacement', async () => {
    rankEquivalences.mockResolvedValueOnce({
      candidates: [],
      missingInfo: ['Falta confirmar la preparación.'],
    });
    const result = await service.suggest('owner', '2026-10-23', 'meal', {
      ...request,
      useAi: true,
    });
    expect(result).toMatchObject({
      status: 'insufficient',
      source: 'ai',
      suggestions: [],
      missingInfo: ['Falta confirmar la preparación.'],
    });
  });
  it('cannot send an unselected account catalog to AI and bounds the reference payload', async () => {
    getEquivalenceContext.mockResolvedValue({
      food: { id: 'tuna', name: 'Atún' },
      day: plan(
        Array.from({ length: 250 }, (_, i) =>
          rule(`Atún ${i}`, {
            aliases: Array(30).fill('Atún ' + 'x'.repeat(190)),
          })
        )
      ),
      catalog: plan([rule('Atún catálogo')], 2),
    });
    rankEquivalences.mockResolvedValue({ candidates: [], missingInfo: [] });
    await service.suggest('owner', '2026-10-23', 'meal', {
      dayPlanVersion: 1,
      catalogPlanVersion: 2,
      useAi: true,
    });
    const payload = rankEquivalences.mock.calls[0][0];
    expect(payload.references).toHaveLength(20);
    expect(
      payload.references.every((ref: { key: string }) =>
        ref.key.startsWith('day:')
      )
    ).toBe(true);
    expect(JSON.stringify(payload).length).toBeLessThan(50000);
  });
});
