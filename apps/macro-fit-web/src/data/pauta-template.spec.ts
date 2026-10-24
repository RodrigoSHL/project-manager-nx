import {
  calculatePauta,
  createPautaTemplate,
  getNutritionPlanTemplates,
  importNutritionPlanTemplate,
  findPautaRule,
  nutritionPlanInputSchema,
  NutritionPlan,
} from '../types/nutrition';
const plan = (): NutritionPlan => ({
  ...createPautaTemplate('2026-10-24'),
  version: 1,
  createdAt: '2026-10-24T12:00:00Z',
});
const food = (
  name: string,
  amount: number,
  unit: 'g' | 'cup' | 'unit' = 'g'
) => ({
  foodName: name,
  foodId: 'unknown',
  amountGrams: amount,
  quantity: { amount, unit },
});

it('covers every food-table row and the three explicit bar/scoop references with valid independent copies', () => {
  const template = getNutritionPlanTemplates()[0];
  const sources = new Set(template.entries.map((entry) => entry.source));
  const sourceTables = {
    65: [2, 16],
    67: [2, 6],
    69: [2, 3],
    72: [2, 4],
    76: [2, 7],
    78: [2, 3],
    83: [2, 10],
    86: [2, 14],
    90: [2, 9],
    94: [2, 8],
    96: [2, 9],
    98: [2, 4],
    100: [2, 3],
    105: [2, 12],
  };
  for (const [table, [start, end]] of Object.entries(sourceTables)) {
    for (let row = start; row <= end; row++)
      expect(sources.has(`${table}:${row}`), `${table}:${row}`).toBe(true);
  }
  for (const row of [2, 3, 4, 5, 6, 9, 10])
    expect(sources.has(`92:${row}`)).toBe(true);
  for (const ref of ['109:2:libres', '109:2:generales', 'P7', 'P8', 'P9'])
    expect(sources.has(ref)).toBe(true);
  expect(template.entries).toHaveLength(133);
  const input = plan();
  expect(
    nutritionPlanInputSchema.safeParse(createPautaTemplate('2026-10-24'))
      .success
  ).toBe(true);
  expect(new Set(input.rules.map((rule) => rule.id)).size).toBe(
    input.rules.length
  );
  expect(
    template.entries.every(
      (entry) => !('calories' in entry.rule) && !('protein' in entry.rule)
    )
  ).toBe(true);
  input.rules[0].referenceAmount = 999;
  template.entries[1].rule.name = 'changed';
  expect(plan().rules[0].referenceAmount).toBe(50);
  expect(getNutritionPlanTemplates()[0].entries[1].rule.name).not.toBe(
    'changed'
  );
});

it('preserves the different raw, cooked and fresh legume exchanges and avoids guessing preparation', () => {
  const p = plan();
  for (const [name, amount, expected] of [
    [
      'Lentejas crudas',
      50,
      [
        { group: 'protein', portions: 1 },
        { group: 'carbs', portions: 0.5 },
      ],
    ],
    [
      'Lentejas cocidas',
      280,
      [
        { group: 'protein', portions: 2 },
        { group: 'carbs', portions: 1 },
      ],
    ],
    ['Habas frescas', 112, [{ group: 'carbs', portions: 1 }]],
    ['Arvejas frescas', 180, [{ group: 'carbs', portions: 1 }]],
    ['Carne de soya cruda', 25, [{ group: 'protein', portions: 1 }]],
    ['Carne de soya cocida', 50, [{ group: 'protein', portions: 1 }]],
  ] as const)
    expect(calculatePauta(p, food(name, amount)).contributions).toEqual(
      expected
    );
  expect(calculatePauta(p, food('Habas', 112)).status).toBe('pending');
  expect(calculatePauta(p, food('Carne de soya', 50)).status).toBe('pending');
  expect(findPautaRule(p, 'unknown', 'Quesillo light')).toBeUndefined();
  expect(
    findPautaRule(p, 'unknown', 'Quesillo light (rodaja de 4 cm)')
      ?.referenceAmount
  ).toBe(90);
});

it('represents ranges and missing weights without inventing grams or losing the foods', () => {
  const p = plan();
  expect(calculatePauta(p, food('Arándanos', 125)).status).toBe('pending');
  expect(
    calculatePauta(p, food('Arándanos', 0.5, 'cup')).contributions
  ).toEqual([{ group: 'fruits', portions: 0.5 }]);
  expect(findPautaRule(p, 'unknown', 'Arándanos')?.notes).toContain('120–130');
  expect(
    calculatePauta(p, food('Galletas crackelet', 10, 'unit')).contributions
  ).toEqual([{ group: 'carbs', portions: 1 }]);
  expect(calculatePauta(p, food('Yogurt proteico', 150)).status).toBe(
    'pending'
  );
  expect(
    calculatePauta(p, food('Yogurt proteico', 1, 'unit')).contributions
  ).toEqual([{ group: 'dairy', portions: 1 }]);
  expect(
    calculatePauta(p, food('Atún en lata al agua', 120)).contributions
  ).toEqual([{ group: 'protein', portions: 2 }]);
  expect(
    calculatePauta(p, food('Atún en lata en aceite', 100)).contributions
  ).toEqual([{ group: 'protein', portions: 2 }]);
  expect(calculatePauta(p, food('Mayonesa', 15)).status).toBe('pending');
  expect(calculatePauta(p, food('Tomate', 100)).status).toBe('free');
  expect(calculatePauta(p, food('Papa cocida', 150)).status).toBe('matched');
});

it('updates the audited base, preserves custom product rules and targets, and never changes the supplied plan', () => {
  const input = createPautaTemplate('2026-10-24');
  input.rules = [
    { ...input.rules[0], referenceAmount: 123 },
    { ...input.rules[1], id: 'my-product', foodIds: ['mine'] },
  ];
  input.targets.protein = 17;
  input.waterTargetMl = 2500;
  input.enabled = false;
  const before = structuredClone(input);
  const merged = importNutritionPlanTemplate(
    input,
    getNutritionPlanTemplates()[0],
    { rules: 'merge', includeTargets: false }
  );
  expect(input).toEqual(before);
  expect(merged.rules).toHaveLength(134);
  expect(merged.rules.find((rule) => rule.id === 'my-product')).toEqual(
    input.rules[1]
  );
  expect(
    merged.rules.find((rule) => rule.id === input.rules[0].id)?.referenceAmount
  ).toBe(50);
  expect(merged.targets.protein).toBe(17);
  expect(merged.waterTargetMl).toBe(2500);
  expect(merged.startsOn).toBe(input.startsOn);
  expect(merged.enabled).toBe(false);
  expect(
    importNutritionPlanTemplate(merged, getNutritionPlanTemplates()[0], {
      rules: 'merge',
      includeTargets: false,
    })
  ).toEqual(merged);
  const replaced = importNutritionPlanTemplate(
    input,
    getNutritionPlanTemplates()[0],
    { rules: 'replace', includeTargets: true }
  );
  expect(replaced.rules).toHaveLength(133);
  expect(replaced.targets.protein).toBe(10);
  expect(replaced.waterTargetMl).toBe(2000);
});

it('consolidates the previous separate orange rule into the complete fruit row without ambiguous catalog matches', () => {
  const draft = createPautaTemplate('2026-10-24');
  const fruit = draft.rules.find((rule) => rule.id === 'meds-manzana');
  if (!fruit) throw new Error('Missing fruit reference');
  draft.rules.push({
    ...fruit,
    id: 'meds-naranja',
    name: 'Naranja',
    foodIds: ['meds-naranja'],
  });
  const imported = importNutritionPlanTemplate(
    draft,
    getNutritionPlanTemplates()[0],
    { rules: 'merge', includeTargets: false }
  );
  expect(imported.rules).toHaveLength(133);
  expect(
    findPautaRule(
      { ...imported, version: 1, createdAt: '' },
      'meds-naranja',
      'Naranja'
    )?.referenceAmount
  ).toBe(100);
});
