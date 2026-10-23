import { COMMON_FOODS } from '../data/common-foods';
import { DEFAULT_MEAL_TEMPLATES } from '../data/meal-templates';
import { FoodItem } from '../types/nutrition';
import { resolveTemplateFood } from './mealTemplates';

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
