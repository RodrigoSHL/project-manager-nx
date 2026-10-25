import { expect, it } from 'vitest';
import { buildFoodGuide, resizeFoodIdea } from './food-guide';
import {
  calculatePauta,
  createPautaTemplate,
  FoodItem,
  MacroGoals,
  MealEntry,
  NutritionPlan,
  PautaRule,
} from '../../types/nutrition';

const goals: MacroGoals = {
  calories: 2000,
  proteinGrams: 100,
  carbsGrams: 200,
  fatGrams: 60,
  distributionPreset: 'balanced',
  waterTargetMl: 2000,
};
const apple: FoodItem = {
  id: 'apple',
  name: 'Manzana',
  servingSizeGrams: 100,
  servingUnit: '100 g',
  calories: 55,
  protein: 0.3,
  carbs: 14,
  fat: 0.2,
  category: 'fruits_veggies',
};
const milk: FoodItem = {
  id: 'milk',
  name: 'Mi leche',
  servingSizeGrams: 200,
  quantityUnit: 'ml',
  servingUnit: '200 ml',
  calories: 80,
  protein: 7,
  carbs: 10,
  fat: 1,
  category: 'dairy',
  isCustom: true,
};
const rule = (
  id: string,
  group: 'fruits' | 'dairy' | 'protein'
): PautaRule => ({
  id,
  name: id,
  foodIds: [id],
  aliases: [],
  referenceAmount: id === 'milk' ? 200 : 100,
  unit: id === 'milk' ? 'ml' : 'g',
  free: false,
  contributions: [{ group, portions: 1 }],
  notes: '',
});
export const guideTestPlan: NutritionPlan = {
  name: 'Mi pauta',
  version: 1,
  startsOn: '2026-10-25',
  createdAt: '2026-10-25T08:00:00Z',
  enabled: true,
  waterTargetMl: 2000,
  waterIsMinimum: false,
  targets: {
    protein: 10,
    carbs: 4,
    fats: 2,
    fruits: 3,
    dairy: 3,
    veggies: null,
    supplements: 0,
  },
  rules: [rule('apple', 'fruits'), rule('milk', 'dairy')],
};
function meal(values: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'entry',
    foodId: 'entry',
    foodName: 'Comida registrada',
    amountGrams: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: 'lunch',
    timestamp: '12:00',
    ...values,
  };
}

it('keeps fruit and dairy needs visible when all macro goals are met, and reports their actual extra nutrients', () => {
  const full = meal({
    calories: 2000,
    protein: 100,
    carbs: 200,
    fat: 60,
    pauta: {
      planVersion: 1,
      status: 'matched',
      contributions: [
        { group: 'protein', portions: 10 },
        { group: 'carbs', portions: 4 },
        { group: 'fats', portions: 2 },
      ],
    },
  });
  const guide = buildFoodGuide({
    goals,
    meals: [full],
    foods: [apple, milk],
    plan: guideTestPlan,
  });
  expect(guide.macroIdeas).toEqual([]);
  const fruit = guide.groups.find((item) => item.group === 'fruits')!;
  expect(fruit.remaining).toBe(3);
  expect(fruit.ideas[0].pauta?.contributions).toEqual([
    { group: 'fruits', portions: 1 },
  ]);
  expect(fruit.ideas[0].macroOverages).toContainEqual({
    key: 'carbs',
    extra: 14,
  });
  expect(guide.groups.find((item) => item.group === 'dairy')?.remaining).toBe(
    3
  );
  expect(guide.groups.find((item) => item.group === 'carbs')?.ideas).toEqual(
    []
  );
});
it('counts pending nutrients but never guesses consumed exchange portions on a read', () => {
  const entry = meal({
    foodId: 'apple',
    foodName: 'Manzana',
    calories: 55,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
  });
  const guide = buildFoodGuide({
    goals,
    meals: [entry],
    foods: [apple],
    plan: guideTestPlan,
  });
  expect(guide.consumed.carbs).toBe(14);
  expect(guide.pending).toBe(1);
  expect(guide.groups.find((item) => item.group === 'fruits')?.consumed).toBe(
    0
  );
  const old = buildFoodGuide({
    goals,
    foods: [apple],
    plan: guideTestPlan,
    meals: [
      {
        ...entry,
        pauta: {
          planVersion: 2,
          status: 'matched',
          contributions: [{ group: 'fruits', portions: 1 }],
        },
      },
    ],
  });
  expect(old.pending).toBe(1);
});
it('warns when a mixed exchange fills protein but also exceeds a completed carbohydrate group', () => {
  const beans: FoodItem = {
    ...apple,
    id: 'beans',
    name: 'Lentejas cocidas',
    category: 'protein',
    servingSizeGrams: 140,
    protein: 12,
    carbs: 20,
    fat: 1,
  };
  const beansRule = {
    ...rule('beans', 'protein'),
    referenceAmount: 140,
    contributions: [
      { group: 'protein' as const, portions: 1 },
      { group: 'carbs' as const, portions: 0.5 },
    ],
  };
  const plan = { ...guideTestPlan, rules: [beansRule] };
  const guide = buildFoodGuide({
    goals,
    foods: [beans],
    plan,
    meals: [
      meal({
        pauta: {
          status: 'matched',
          planVersion: 1,
          contributions: [{ group: 'carbs', portions: 4 }],
        },
      }),
    ],
  });
  expect(
    guide.groups.find((item) => item.group === 'protein')!.ideas[0]
      .portionOverages
  ).toEqual([{ group: 'carbs', extra: 0.5 }]);
});
it('keeps incompatible units and absent nutrition unknown, rather than assuming grams equal millilitres', () => {
  const guide = buildFoodGuide({
    goals,
    meals: [],
    foods: [{ ...milk, quantityUnit: 'g' }],
    plan: guideTestPlan,
  });
  const idea = guide.groups.find((item) => item.group === 'dairy')!.ideas[0];
  expect(idea.quantity).toEqual({ amount: 200, unit: 'ml' });
  expect(idea.food).toBeUndefined();
  expect(idea.nutrients).toBeNull();
  expect(idea.pauta?.contributions).toEqual([{ group: 'dairy', portions: 1 }]);
  expect(idea.macroOverages).toEqual([]);
});
it('uses only an explicit grams-per-unit conversion from the effective plan', () => {
  const plan = {
    ...guideTestPlan,
    rules: [
      {
        ...rule('apple', 'fruits'),
        referenceAmount: 0.5,
        unit: 'cup' as const,
        gramsPerUnit: 80,
      },
    ],
  };
  const guide = buildFoodGuide({ goals, meals: [], foods: [apple], plan });
  const idea = guide.groups.find((item) => item.group === 'fruits')!.ideas[0];
  expect(idea.quantity).toEqual({ amount: 40, unit: 'g' });
  expect(idea.nutrients?.calories).toBe(22);
  expect(idea.pauta?.contributions[0].portions).toBe(1);
});
it('distinguishes free vegetables from free condiments and never invents their weight or macro values', () => {
  const vegetable = createPautaTemplate('2026-10-25').rules.find(
    (item) => item.id === 'ref-verdura-libre-1'
  )!;
  const condiment = {
    ...rule('mustard', 'fruits'),
    name: 'Mostaza',
    free: true,
    contributions: [],
  };
  const plan = { ...guideTestPlan, rules: [vegetable, condiment] };
  const entry = meal({
    pauta: {
      status: 'free',
      planVersion: 1,
      ruleId: 'mustard',
      contributions: [],
    },
  });
  const guide = buildFoodGuide({ goals, meals: [entry], foods: [], plan });
  const veggies = guide.groups.find((item) => item.group === 'veggies')!;
  expect(veggies.remaining).toBeNull();
  expect(veggies.freeRecords).toBe(0);
  expect(veggies.ideas).toHaveLength(1);
  expect(veggies.ideas[0]).toMatchObject({
    nutrients: null,
    quantity: null,
    pauta: { status: 'free', contributions: [] },
  });
  entry.pauta!.ruleId = vegetable.id;
  expect(
    buildFoodGuide({ goals, meals: [entry], foods: [], plan }).groups.find(
      (item) => item.group === 'veggies'
    )!.freeRecords
  ).toBe(1);
});
it('does not create a fruit goal for a group configured without a target or for a disabled plan', () => {
  const plan = {
    ...guideTestPlan,
    targets: { ...guideTestPlan.targets, fruits: null },
  };
  const guide = buildFoodGuide({ goals, meals: [], foods: [apple], plan });
  expect(
    guide.groups.find((item) => item.group === 'fruits')!.remaining
  ).toBeNull();
  expect(guide.groups.find((item) => item.group === 'fruits')!.ideas).toEqual(
    []
  );
  const disabled = buildFoodGuide({
    goals,
    meals: [],
    foods: [apple],
    plan: { ...plan, enabled: false },
  });
  expect(disabled.groups).toEqual([]);
  expect(disabled.macroIdeas).toHaveLength(1);
});
it('fits a half serving when needed but does not invent a fraction of a counted product', () => {
  const low = { ...goals, carbsGrams: 8 };
  const guide = buildFoodGuide({
    goals: low,
    meals: [],
    foods: [
      apple,
      { ...apple, id: 'unit', quantityUnit: 'unit', servingSizeGrams: 1 },
    ],
  });
  expect(guide.macroIdeas).toHaveLength(1);
  expect(guide.macroIdeas[0].quantity).toEqual({ amount: 50, unit: 'g' });
  expect(guide.macroIdeas[0].macroOverages).toEqual([]);
});
it('uses diary rounding when checking a tight calorie margin', () => {
  const guide = buildFoodGuide({
    goals: { ...goals, calories: 27.7 },
    meals: [],
    foods: [apple],
  });
  // Half the base is 27.5 kcal; a diary entry persists 28 kcal, which does not fit.
  expect(guide.macroIdeas).toEqual([]);
  const fits = buildFoodGuide({
    goals: { ...goals, calories: 28 },
    meals: [],
    foods: [apple],
  });
  expect(fits.macroIdeas[0].nutrients?.calories).toBe(28);
});
it('recalculates a chosen quantity in its native units and preserves the selected rule', () => {
  const guide = buildFoodGuide({
    goals,
    meals: [],
    foods: [milk],
    plan: guideTestPlan,
  });
  const idea = guide.groups.find((item) => item.group === 'dairy')!.ideas[0];
  const resized = resizeFoodIdea(idea, 300, guide);
  expect(resized.quantity).toEqual({ amount: 300, unit: 'ml' });
  expect(resized.nutrients?.calories).toBe(120);
  expect(resized.pauta?.contributions).toEqual([
    { group: 'dairy', portions: 1.5 },
  ]);
  expect(resized.food?.pautaSelection).toEqual({ ruleId: 'milk' });
});
it('reports only the excess added by an option while preserving the existing exceeded balance', () => {
  const guide = buildFoodGuide({
    goals,
    foods: [milk],
    plan: guideTestPlan,
    meals: [meal({ carbs: 220 })],
  });
  const idea = guide.groups.find((item) => item.group === 'dairy')!.ideas[0];
  expect(guide.exceeded.carbs).toBe(20);
  expect(idea.macroOverages).toContainEqual({ key: 'carbs', extra: 10 });
});
it('does not mutate plans, meal snapshots or catalog entries', () => {
  const input = {
    goals,
    meals: [meal()],
    foods: [milk, apple],
    plan: guideTestPlan,
  };
  const original = structuredClone(input);
  buildFoodGuide(input);
  expect(input).toEqual(original);
});
