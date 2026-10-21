import React, { useState } from 'react';
import { MacroProgressRings } from './MacroProgressRings';
import { PautaSummaryCard } from './PautaSummaryCard';
import { MealSection } from './MealSection';
import { WaterTrackerCard } from './WaterTrackerCard';
import { FoodSelectorModal } from './FoodSelectorModal';
import { CustomFoodModal } from './CustomFoodModal';
import { FoodItem, MacroGoals, MealEntry, MealType } from '../types/nutrition';
import { Sparkles, UtensilsCrossed } from 'lucide-react';
import { MEDS_PAUTA_PORTIONS } from '../utils/calculator';

interface DailyTrackerViewProps {
  goals: MacroGoals;
  meals: MealEntry[];
  consumedTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  consumedPortions: {
    protein: number;
    carbs: number;
    fats: number;
    dairy: number;
    fruits: number;
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
  consumedPortions,
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
  const colacionAmMeals = meals.filter((m) => m.mealType === 'colacion_am');
  const lunchMeals = meals.filter((m) => m.mealType === 'lunch');
  const colacionPmMeals = meals.filter((m) => m.mealType === 'colacion_pm');
  const dinnerMeals = meals.filter((m) => m.mealType === 'dinner');
  const snackMeals = meals.filter((m) => m.mealType === 'snacks');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Tarjeta de Cumplimiento de Pauta MEDS (Porciones intercambiables) */}
      <PautaSummaryCard
        targets={goals.pautaPortions || MEDS_PAUTA_PORTIONS}
        consumed={consumedPortions}
      />

      {/* 2. Anillo Central de Calorías y Barras de Macronutrientes (Gramos) */}
      <MacroProgressRings goals={goals} consumed={consumedTotals} />

      {/* 3. Tarjeta de Hidratación (> 2 Litros según pauta) */}
      <WaterTrackerCard
        currentMl={waterIntakeMl}
        targetMl={goals.waterTargetMl || 2500}
        onAddWater={onAddWater}
        onResetWater={onResetWater}
      />

      {/* 4. Secciones de Comidas (Estructura de 5 tiempos recomendada en pauta) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <span>Tiempos de Comida Diarios</span>
          </h2>
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Metas ({goals.calories} kcal)</span>
          </button>
        </div>

        {/* Comida 1: Desayuno */}
        <MealSection
          mealType="breakfast"
          title="Comida 1: Desayuno"
          subtitle="Pauta: 1 Carb + 2 Prot + ½ Grasa + 1 Lácteo"
          icon="🌅"
          entries={breakfastMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Mañana */}
        <MealSection
          mealType="colacion_am"
          title="Colación Mañana"
          subtitle="Pauta: 1 Fruta entera + 1 Lácteo"
          icon="🍏"
          entries={colacionAmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 2: Almuerzo */}
        <MealSection
          mealType="lunch"
          title="Comida 2: Almuerzo"
          subtitle="Pauta: Verduras libre + 4 Prot (200g) + 1 Carb + 1 Grasa + 1 Fruta"
          icon="☀️"
          entries={lunchMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Tarde */}
        <MealSection
          mealType="colacion_pm"
          title="Colación Tarde"
          subtitle="Pauta: 1 Fruta + 1 Carbohidrato + 1 Lácteo"
          icon="🥪"
          entries={colacionPmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 3: Cena */}
        <MealSection
          mealType="dinner"
          title="Comida 3: Cena"
          subtitle="Pauta: Verduras libre + 4 Prot (200g) + 1 Carb + ½ Grasa"
          icon="🌙"
          entries={dinnerMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Snacks Extra */}
        {snackMeals.length > 0 && (
          <MealSection
            mealType="snacks"
            title="Snacks Extra / Pre/Post Entreno"
            subtitle="Barras proteicas, colaciones adicionales"
            icon="⚡"
            entries={snackMeals}
            onOpenAddFood={(type) => setSelectedMealType(type)}
            onRemoveEntry={onRemoveMealEntry}
          />
        )}
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
