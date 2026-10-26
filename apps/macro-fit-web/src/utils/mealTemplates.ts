import {
  FoodItem,
  MealTemplate,
  MealTemplateItem,
  NutritionPlan,
  PAUTA_GROUPS,
  calculatePauta,
  templateSchema,
  pautaSelectionSchema,
} from '../types/nutrition';
import { scaleFoodNutrients } from './food-nutrients';

export function resolveTemplateFood(
  item: MealTemplateItem,
  foods: FoodItem[]
): FoodItem | undefined {
  const food =
    item.food ?? foods.find((candidate) => candidate.id === item.foodId);
  if (!food) return undefined;
  const savedUnit = item.quantityUnit ?? item.food?.quantityUnit ?? 'g';
  // A legacy combo without a snapshot cannot reinterpret 30 grams as 30 scoops.
  return (food.quantityUnit ?? 'g') === savedUnit ? food : undefined;
}

/** One calculation for the editor, registration preview and diary write. */
export function previewMealTemplate(
  template: Pick<MealTemplate, 'items'>,
  foods: FoodItem[],
  multiplier = 1,
  plan?: NutritionPlan | null
) {
  const items = template.items.map((item) => {
    const stored = resolveTemplateFood(item, foods);
    const amount = Number((item.amountGrams * multiplier).toPrecision(12));
    const valid =
      Number.isFinite(amount) &&
      amount >= 0.001 &&
      amount <= 20000 &&
      !!stored &&
      stored.servingSizeGrams > 0;
    // Explicit converted quantities in snapshots belong to their nutritional base.
    // For example, 150 g = 1 cup becomes 2 cups when registering 300 g.
    let food =
      valid && stored
        ? {
            ...stored,
            ...(stored.pautaSelection?.quantity
              ? {
                  pautaSelection: {
                    ...stored.pautaSelection,
                    quantity: {
                      ...stored.pautaSelection.quantity,
                      amount:
                        (stored.pautaSelection.quantity.amount * amount) /
                        stored.servingSizeGrams,
                    },
                  },
                }
              : {}),
          }
        : undefined;
    if (
      food?.pautaSelection?.ruleId &&
      plan !== undefined &&
      (!plan?.enabled ||
        !plan.rules.some((rule) => rule.id === food!.pautaSelection!.ruleId))
    ) {
      // Keep obsolete references pending instead of sending a foreign rule ID
      // to the API or guessing another exchange from a different plan version.
      food = { ...food, pautaSelection: { ruleId: null } };
    }
    if (
      food?.pautaSelection &&
      !pautaSelectionSchema.safeParse(food.pautaSelection).success
    )
      food = undefined;
    const nutrients = food ? scaleFoodNutrients(food, amount) : null;
    const pauta =
      food && plan?.enabled
        ? calculatePauta(
            plan,
            {
              foodId: food.id,
              foodName: food.name,
              amountGrams: amount,
              quantity: { amount, unit: food.quantityUnit ?? 'g' },
            },
            food.pautaSelection
          )
        : null;
    return { food, amount, nutrients, pauta, item };
  });
  const complete =
    Number.isFinite(multiplier) &&
    multiplier > 0 &&
    items.length > 0 &&
    items.length <= 100 &&
    items.every((item) => item.nutrients);
  const totals = complete
    ? items.reduce(
        (sum, item) => ({
          calories: sum.calories + item.nutrients!.calories,
          protein: sum.protein + item.nutrients!.protein,
          carbs: sum.carbs + item.nutrients!.carbs,
          fat: sum.fat + item.nutrients!.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;
  const portions = PAUTA_GROUPS.map((group) => ({
    group,
    portions: items.reduce(
      (sum, item) =>
        sum +
        (item.pauta?.contributions.find((value) => value.group === group)
          ?.portions ?? 0),
      0
    ),
  })).filter((item) => item.portions > 0);
  const pending = items.filter(
    (item) => item.pauta?.status === 'pending'
  ).length;
  return { items, totals, complete, portions, pending };
}

export function snapshotMealTemplate(
  template: MealTemplate,
  foods: FoodItem[]
): MealTemplate {
  const preview = previewMealTemplate(template, foods);
  if (!preview.complete)
    throw new Error(
      'Revisa los alimentos, sus cantidades y unidades antes de guardar el combo.'
    );
  const result = templateSchema.safeParse({
    ...template,
    name: template.name.trim(),
    description: template.description.trim(),
    isCustom: true,
    items: template.items.map((item) => {
      const food = resolveTemplateFood(item, foods)!;
      return {
        foodId: food.id,
        amountGrams: item.amountGrams,
        quantityUnit: food.quantityUnit ?? 'g',
        food: structuredClone(food),
      };
    }),
  });
  if (!result.success)
    throw new Error(
      'Indica un nombre y entre 1 y 100 alimentos con cantidades válidas.'
    );
  return result.data;
}
