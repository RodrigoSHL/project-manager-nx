import { FoodItem } from '../types/nutrition';

/** Match the precision persisted in diary entries, including declared energy. */
export function scaleFoodNutrients(food: FoodItem, amount: number) {
  const ratio = amount / food.servingSizeGrams;
  return {
    calories: Math.round(food.calories * ratio),
    protein: Number((food.protein * ratio).toFixed(1)),
    carbs: Number((food.carbs * ratio).toFixed(1)),
    fat: Number((food.fat * ratio).toFixed(1)),
  };
}
