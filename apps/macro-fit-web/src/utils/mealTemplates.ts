import { FoodItem, MealTemplateItem } from '../types/nutrition';

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
