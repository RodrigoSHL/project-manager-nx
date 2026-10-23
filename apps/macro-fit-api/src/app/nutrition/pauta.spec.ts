import {
  calculatePauta,
  findPautaRule,
  NutritionPlan,
  nutritionPlanSchema,
  summarizePauta,
  saveNutritionPlanSchema,
  MealEntry,
} from '@project-manager/macrofit-contracts';

const plan: NutritionPlan = {
  name: 'Pauta de prueba',
  startsOn: '2026-10-23',
  enabled: true,
  version: 1,
  createdAt: '2026-10-23T12:00:00Z',
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
  waterIsMinimum: true,
  rules: [
    {
      id: 'chicken',
      name: 'Pollo cocido',
      foodIds: ['chicken'],
      aliases: ['Pechuga de pollo cocida'],
      referenceAmount: 50,
      unit: 'g',
      free: false,
      notes: '',
      contributions: [{ group: 'protein', portions: 1 }],
    },
    {
      id: 'legumes',
      name: 'Lentejas cocidas',
      foodIds: [],
      aliases: [],
      referenceAmount: 140,
      unit: 'g',
      free: false,
      notes: '',
      contributions: [
        { group: 'protein', portions: 1 },
        { group: 'carbs', portions: 0.5 },
      ],
    },
    {
      id: 'oil',
      name: 'Aceite',
      foodIds: [],
      aliases: [],
      referenceAmount: 20,
      unit: 'ml',
      free: false,
      notes: '',
      contributions: [{ group: 'fats', portions: 1 }],
    },
    {
      id: 'bar',
      name: 'Barra de prueba',
      foodIds: [],
      aliases: [],
      referenceAmount: 1,
      unit: 'unit',
      free: false,
      notes: '',
      contributions: [
        { group: 'protein', portions: 1 },
        { group: 'carbs', portions: 0.5 },
      ],
    },
    {
      id: 'salad',
      name: 'Ensalada verde',
      foodIds: [],
      aliases: [],
      referenceAmount: 100,
      unit: 'g',
      free: true,
      notes: '',
      contributions: [],
    },
  ],
};
const food = (foodName: string, amountGrams: number) => ({
  foodId: 'ai',
  foodName,
  amountGrams,
});

describe('Exchange portions shared calculation', () => {
  it('keeps existing blank plans readable but prevents activating another unconfigured plan', () => {
    const blank = {
      ...plan,
      rules: [],
      targets: {
        protein: null,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
    };
    expect(nutritionPlanSchema.safeParse(blank).success).toBe(true);
    const { version, createdAt, ...input } = blank;
    expect(version).toBe(1);
    expect(createdAt).toBeTruthy();
    expect(saveNutritionPlanSchema.safeParse(input).success).toBe(false);
    expect(
      saveNutritionPlanSchema.safeParse({ ...input, enabled: false }).success
    ).toBe(true);
    const configured = { ...input, rules: plan.rules, targets: plan.targets };
    expect(
      saveNutritionPlanSchema.safeParse({ ...configured, applyToToday: true })
        .success
    ).toBe(true);
  });
  it('counts by food reference, preserves precision and sums all groups', () => {
    expect(
      calculatePauta(plan, food('Pollo cocido', 200)).contributions
    ).toEqual([{ group: 'protein', portions: 4 }]);
    const lentils = calculatePauta(plan, food('Lentejas cocidas', 50));
    expect(lentils.contributions[0].portions).toBeCloseTo(50 / 140, 12);
    expect(lentils.contributions[1].portions).toBeCloseTo(25 / 140, 12);
    const meal = {
      ...food('Lentejas cocidas', 50),
      pauta: lentils,
    } as MealEntry;
    const summary = summarizePauta([meal, meal], plan);
    expect(summary.consumed.protein).toBeCloseTo(100 / 140, 12);
    expect(summary.consumed.carbs).toBeCloseTo(50 / 140, 12);
  });
  it('does not infer cooked preparation, unknown brands, ambiguous matches or quantities', () => {
    expect(calculatePauta(plan, food('Pollo crudo', 200)).status).toBe(
      'pending'
    );
    expect(calculatePauta(plan, food('Pollo', 200)).status).toBe('pending');
    expect(calculatePauta(plan, food('Barra de otra marca', 45)).status).toBe(
      'pending'
    );
    expect(
      calculatePauta(plan, food('Pollo cocido', 200), { ruleId: null }).status
    ).toBe('pending');
    expect(
      findPautaRule(
        {
          ...plan,
          rules: [...plan.rules, { ...plan.rules[0], id: 'duplicate' }],
        },
        'chicken',
        'Pollo cocido'
      )
    ).toBeUndefined();
    expect(
      calculatePauta(plan, food('  pechuga de POLLO cocida ', 200)).status
    ).toBe('matched');
  });
  it('keeps grams, millilitres and units distinct unless a conversion is explicitly configured', () => {
    expect(calculatePauta(plan, food('Aceite', 20)).status).toBe('pending');
    expect(
      calculatePauta(plan, {
        ...food('Aceite', 10),
        quantity: { amount: 10, unit: 'ml' },
      }).contributions
    ).toEqual([{ group: 'fats', portions: 0.5 }]);
    expect(calculatePauta(plan, food('Barra de prueba', 45)).status).toBe(
      'pending'
    );
    expect(
      calculatePauta(plan, food('Barra de prueba', 45), {
        ruleId: 'bar',
        quantity: { amount: 1, unit: 'unit' },
      }).contributions
    ).toEqual([
      { group: 'protein', portions: 1 },
      { group: 'carbs', portions: 0.5 },
    ]);
    const explicit = {
      ...plan,
      rules: plan.rules.map((rule) =>
        rule.id === 'bar' ? { ...rule, gramsPerUnit: 45 } : rule
      ),
    };
    expect(
      calculatePauta(explicit, food('Barra de prueba', 90)).contributions[0]
        .portions
    ).toBe(2);
  });
  it('shows free foods and legacy/unknown rows without inventing progress', () => {
    expect(calculatePauta(plan, food('Ensalada verde', 100)).status).toBe(
      'free'
    );
    expect(
      summarizePauta(
        [
          {
            ...food('Old', 200),
            portionGroup: 'protein',
            portionsCount: 4,
          } as MealEntry,
        ],
        plan
      ).pending
    ).toBe(1);
  });
  it('validates stored versions and rejects duplicate groups or malformed rules', () => {
    expect(nutritionPlanSchema.safeParse(plan).success).toBe(true);
    expect(
      nutritionPlanSchema.safeParse({
        ...plan,
        rules: [{ ...plan.rules[0], referenceAmount: 0 }],
      }).success
    ).toBe(false);
    expect(
      nutritionPlanSchema.safeParse({
        ...plan,
        rules: [
          {
            ...plan.rules[0],
            contributions: [
              { group: 'protein', portions: 1 },
              { group: 'protein', portions: 2 },
            ],
          },
        ],
      }).success
    ).toBe(false);
  });
});
