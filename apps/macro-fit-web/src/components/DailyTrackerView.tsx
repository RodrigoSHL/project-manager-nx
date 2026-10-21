import React, { useState } from 'react';
import { MacroProgressRings } from './MacroProgressRings';
import { MealSection } from './MealSection';
import { WaterTrackerCard } from './WaterTrackerCard';
import { FoodSelectorModal } from './FoodSelectorModal';
import { CustomFoodModal } from './CustomFoodModal';
import { FoodItem, MacroGoals, MealEntry, MealType } from '../types/nutrition';
import { Sparkles, UtensilsCrossed } from 'lucide-react';

interface DailyTrackerViewProps {
  goals: MacroGoals;
  meals: MealEntry[];
  consumedTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  waterIntakeMl: number;
  allFoods: FoodItem[];
  onAddMealEntry: (mealType: MealType, food: FoodItem, amountGrams: number) => void;
  onRemoveMealEntry: (entryId: string) => void;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
  onSaveCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => void;
  onOpenCalculator: () => void;
}

export const DailyTrackerView: React.FC<DailyTrackerViewProps> = ({
  goals,
  meals,
  consumedTotals,
  waterIntakeMl,
  allFoods,
  onAddMealEntry,
  onRemoveMealEntry,
  onAddWater,
  onResetWater,
  onSaveCustomFood,
  onOpenCalculator,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);

  // Group meals by mealType
  const breakfastMeals = meals.filter((m) => m.mealType === 'breakfast');
  const lunchMeals = meals.filter((m) => m.mealType === 'lunch');
  const dinnerMeals = meals.filter((m) => m.mealType === 'dinner');
  const snackMeals = meals.filter((m) => m.mealType === 'snacks');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Dynamic Summary Cards */}
      <MacroProgressRings goals={goals} consumed={consumedTotals} />

      {/* Hydration Tracker */}
      <WaterTrackerCard
        currentMl={waterIntakeMl}
        targetMl={goals.waterTargetMl || 2500}
        onAddWater={onAddWater}
        onResetWater={onResetWater}
      />

      {/* Meal Logger Sections */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <span>Registro de Comidas</span>
          </h2>
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajustar Metas ({goals.calories} kcal)</span>
          </button>
        </div>

        <MealSection
          mealType="breakfast"
          title="Desayuno"
          subtitle="Comienza tu día con energía limpia"
          icon="🌅"
          entries={breakfastMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        <MealSection
          mealType="lunch"
          title="Almuerzo"
          subtitle="Nutrición balanceada de medio día"
          icon="☀️"
          entries={lunchMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        <MealSection
          mealType="dinner"
          title="Cena"
          subtitle="Recuperación nocturna y descanso"
          icon="🌙"
          entries={dinnerMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        <MealSection
          mealType="snacks"
          title="Snacks & Pre/Post Entreno"
          subtitle="Colaciones, batidos y frutas"
          icon="🍎"
          entries={snackMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />
      </div>

      {/* Modal: Select & Scale Food */}
      <FoodSelectorModal
        isOpen={selectedMealType !== null}
        mealType={selectedMealType}
        foods={allFoods}
        onClose={() => setSelectedMealType(null)}
        onAddFood={onAddMealEntry}
        onOpenCreateCustom={() => {
          setSelectedMealType(null);
          setIsCustomFoodModalOpen(true);
        }}
      />

      {/* Modal: Create Custom Food */}
      <CustomFoodModal
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        onSaveFood={onSaveCustomFood}
      />
    </div>
  );
};
