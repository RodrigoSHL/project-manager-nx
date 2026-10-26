import { COMMON_FOODS } from '../data/common-foods';
import { DEFAULT_MEAL_TEMPLATES } from '../data/meal-templates';
import { FoodItem, MealTemplate, NutritionPlan } from '../types/nutrition';
import {
  previewMealTemplate,
  resolveTemplateFood,
  snapshotMealTemplate,
} from './mealTemplates';

it('requires reviewing legacy gram combos when the current catalog uses native units', () => {
  expect(
    resolveTemplateFood(
      { foodId: 'meds-scoop-proteina', amountGrams: 30 },
      COMMON_FOODS
    )
  ).toBeUndefined();
  expect(
    resolveTemplateFood(
      { foodId: 'meds-scoop-proteina', amountGrams: 1, quantityUnit: 'scoop' },
      COMMON_FOODS
    )?.quantityUnit
  ).toBe('scoop');
});

it('preserves old gram snapshots instead of reinterpreting them through a changed catalog', () => {
  const snapshot: FoodItem = {
    id: 'meds-scoop-proteina',
    name: 'Whey anterior',
    servingSizeGrams: 30,
    servingUnit: '30g',
    calories: 120,
    protein: 24,
    carbs: 2,
    fat: 1.5,
    category: 'protein',
  };
  expect(
    resolveTemplateFood(
      { foodId: snapshot.id, amountGrams: 30, food: snapshot },
      COMMON_FOODS
    )
  ).toEqual(snapshot);
});

it('keeps default porridge at one scoop and resolves every declared template unit', () => {
  for (const template of DEFAULT_MEAL_TEMPLATES)
    for (const item of template.items)
      expect(resolveTemplateFood(item, COMMON_FOODS)).toBeDefined();
  const scoop = DEFAULT_MEAL_TEMPLATES[0].items.find(
    (item) => item.foodId === 'meds-scoop-proteina'
  );
  expect(scoop).toMatchObject({ amountGrams: 1, quantityUnit: 'scoop' });
});

const milk: FoodItem = {
  id: 'personal-milk',
  name: 'Leche propia',
  servingSizeGrams: 100,
  servingUnit: '100 ml',
  quantityUnit: 'ml',
  calories: 42,
  protein: 3.4,
  carbs: 5,
  fat: 0.1,
  category: 'dairy',
  isCustom: true,
};
const combo: MealTemplate = {
  id: 'personal-combo',
  name: 'Mi combinación',
  description: '',
  mealType: 'breakfast',
  icon: 'utensils',
  items: [
    { foodId: milk.id, amountGrams: 150, quantityUnit: 'ml', food: milk },
  ],
};
it('snapshots owned foods on save and retains the old nutrients after a catalog edit or removal', () => {
  const saved = snapshotMealTemplate(
    {
      ...combo,
      items: [{ foodId: milk.id, amountGrams: 150, quantityUnit: 'ml' }],
    },
    [milk]
  );
  expect(saved.items[0].food).toEqual(milk);
  expect(saved.items[0].food).not.toBe(milk);
  expect(
    previewMealTemplate(saved, [{ ...milk, calories: 100 }]).totals
  ).toMatchObject({ calories: 63, protein: 5.1, carbs: 7.5, fat: 0.2 });
  expect(previewMealTemplate(saved, []).complete).toBe(true);
});
it('scales native-unit portions and explicit pauta conversions together without modifying the original combo', () => {
  const originalFood: FoodItem = {
    ...milk,
    id: 'oats',
    name: 'Avena',
    quantityUnit: 'g',
    servingSizeGrams: 150,
    calories: 200,
    protein: 5,
    carbs: 40,
    fat: 3,
    pautaSelection: { ruleId: 'oat-cup', quantity: { amount: 1, unit: 'cup' } },
  };
  const original = {
    ...combo,
    items: [
      {
        foodId: originalFood.id,
        amountGrams: 150,
        quantityUnit: 'g' as const,
        food: originalFood,
      },
    ],
  };
  const plan: NutritionPlan = {
    name: 'Pauta de prueba',
    enabled: true,
    startsOn: '2026-10-25',
    version: 1,
    createdAt: '2026-10-25T00:00:00Z',
    waterTargetMl: 2000,
    waterIsMinimum: false,
    targets: {
      protein: 10,
      carbs: 4,
      fats: 2,
      dairy: 3,
      fruits: 3,
      veggies: null,
      supplements: 0,
    },
    rules: [
      {
        id: 'oat-cup',
        name: 'Avena en taza',
        foodIds: [],
        aliases: [],
        unit: 'cup',
        referenceAmount: 1,
        free: false,
        contributions: [{ group: 'carbs', portions: 1 }],
        notes: '',
      },
    ],
  };
  const preview = previewMealTemplate(original, [], 2, plan);
  expect(preview.totals).toMatchObject({ calories: 400, carbs: 80 });
  expect(preview.items[0].amount).toBe(300);
  expect(preview.items[0].food?.pautaSelection?.quantity).toEqual({
    amount: 2,
    unit: 'cup',
  });
  expect(preview.portions).toEqual([{ group: 'carbs', portions: 2 }]);
  expect(original.items[0].food.pautaSelection?.quantity?.amount).toBe(1);
  const stale = previewMealTemplate(original, [], 1, { ...plan, rules: [] });
  expect(stale.complete).toBe(true);
  expect(stale.items[0].food?.pautaSelection).toEqual({ ruleId: null });
  expect(stale.pending).toBe(1);
  expect(
    snapshotMealTemplate(
      { ...original, items: [{ ...original.items[0], amountGrams: 300 }] },
      []
    ).items[0].food?.pautaSelection?.quantity?.amount
  ).toBe(1);
});
it('never reports partial totals as complete when an ingredient is missing or a scaled quantity is invalid', () => {
  for (const bad of [0, -1, NaN, 20001])
    expect(
      previewMealTemplate(
        { items: [{ ...combo.items[0], amountGrams: bad }] },
        []
      ).totals
    ).toBeNull();
  const missing = {
    ...combo,
    items: [...combo.items, { foodId: 'missing', amountGrams: 100 }],
  };
  expect(previewMealTemplate(missing, []).totals).toBeNull();
  expect(() => snapshotMealTemplate(missing, [])).toThrow(
    'Revisa los alimentos'
  );
  expect(previewMealTemplate(combo, [], 200).totals).toBeNull();
});
