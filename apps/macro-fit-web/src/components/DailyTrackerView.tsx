import React, { useState } from 'react';
import { MacroProgressRings } from './MacroProgressRings';
import { PautaSummaryCard } from './PautaSummaryCard';
import { MealSection } from './MealSection';
import { WaterTrackerCard } from './WaterTrackerCard';
import { FoodSelectorModal } from './FoodSelectorModal';
import { CustomFoodModal } from './CustomFoodModal';
import { MealTemplatesModal } from './MealTemplatesModal';
import { PlateCameraModal } from './PlateCameraModal';
import { PlateAnalysisResultModal } from './PlateAnalysisResultModal';
import {
  FoodItem,
  MacroGoals,
  MealEntry,
  MealTemplate,
  MealType,
  PlateAnalysisResponse,
} from '../types/nutrition';
import { Camera, Sparkles, UtensilsCrossed, Zap } from 'lucide-react';
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
  allTemplates: MealTemplate[];
  onAddMealEntry: (mealType: MealType, food: FoodItem, amountGrams: number) => void;
  onAddMultipleMealEntries?: (
    items: Array<{ mealType: MealType; food: FoodItem; amountGrams: number }>
  ) => void;
  onRemoveMealEntry: (entryId: string) => void;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
  onSaveCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => void;
  onApplyTemplate: (template: MealTemplate, mealType?: MealType) => void;
  onSaveCurrentAsTemplate?: (name: string, description: string, mealType: MealType) => void;
  onOpenCalculator: () => void;
}

export const DailyTrackerView: React.FC<DailyTrackerViewProps> = ({
  goals,
  meals,
  consumedTotals,
  consumedPortions,
  waterIntakeMl,
  allFoods,
  allTemplates,
  onAddMealEntry,
  onAddMultipleMealEntries,
  onRemoveMealEntry,
  onAddWater,
  onResetWater,
  onSaveCustomFood,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  onOpenCalculator,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedTemplateMealType, setSelectedTemplateMealType] = useState<MealType | null>(null);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);

  // Gemini Vision Plate Analysis State
  const [scanCameraMealType, setScanCameraMealType] = useState<MealType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PlateAnalysisResponse | null>(null);
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string>('');
  const [analysisTargetMeal, setAnalysisTargetMeal] = useState<MealType>('lunch');

  // Group meals by mealType
  const breakfastMeals = meals.filter((m) => m.mealType === 'breakfast');
  const colacionAmMeals = meals.filter((m) => m.mealType === 'colacion_am');
  const lunchMeals = meals.filter((m) => m.mealType === 'lunch');
  const colacionPmMeals = meals.filter((m) => m.mealType === 'colacion_pm');
  const dinnerMeals = meals.filter((m) => m.mealType === 'dinner');
  const snackMeals = meals.filter((m) => m.mealType === 'snacks');

  const currentTemplateEntries = selectedTemplateMealType
    ? meals.filter((m) => m.mealType === selectedTemplateMealType)
    : [];

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

      {/* 4. Barra de Acción Rápida: Escaneo de Plato con IA (Gemini Vision) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-500/30 p-4 shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shrink-0 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Escanear Plato con IA</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Centra tu plato a 45° con calibración de 25 cm. La IA descompone los ingredientes y tú ajustas los gramos con 1 toque.
              </p>
            </div>
          </div>

          <button
            onClick={() => setScanCameraMealType('lunch')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Abrir Cámara / Foto</span>
          </button>
        </div>
      </div>

      {/* 5. Secciones de Comidas (Estructura de 5 tiempos recomendada en pauta) */}
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
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
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
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
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
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
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
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
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
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
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
            onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
            onOpenScanPlate={(type) => setScanCameraMealType(type)}
            onRemoveEntry={onRemoveMealEntry}
          />
        )}
      </div>

      {/* Modal: Select & Scale Single Food */}
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

      {/* Modal: Pre-saved Meal Templates / Combos */}
      <MealTemplatesModal
        isOpen={selectedTemplateMealType !== null}
        mealType={selectedTemplateMealType}
        templates={allTemplates}
        allFoods={allFoods}
        currentMealEntries={currentTemplateEntries}
        onClose={() => setSelectedTemplateMealType(null)}
        onApplyTemplate={onApplyTemplate}
        onSaveCurrentAsTemplate={onSaveCurrentAsTemplate}
      />

      {/* Modal: Create Custom Food */}
      <CustomFoodModal
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        onSaveFood={onSaveCustomFood}
      />

      {/* Modal: Camera / Photo Capture with Visual 25cm Overlay Guide */}
      <PlateCameraModal
        isOpen={scanCameraMealType !== null}
        defaultMealType={scanCameraMealType || 'lunch'}
        onClose={() => setScanCameraMealType(null)}
        onAnalysisSuccess={(analysis, imageUrl, targetMeal) => {
          setAnalysisResult(analysis);
          setAnalysisImageUrl(imageUrl);
          setAnalysisTargetMeal(targetMeal);
        }}
      />

      {/* Modal: AI Plate Analysis Breakdown & 1-Tap Gram Adjustment */}
      <PlateAnalysisResultModal
        isOpen={analysisResult !== null}
        analysis={analysisResult}
        imageUrl={analysisImageUrl}
        defaultMealType={analysisTargetMeal}
        onClose={() => {
          setAnalysisResult(null);
          setAnalysisImageUrl('');
        }}
        onConfirmPlate={(entries, mealType) => {
          if (onAddMultipleMealEntries) {
            onAddMultipleMealEntries(
              entries.map(({ food, amountGrams }) => ({ mealType, food, amountGrams }))
            );
          } else {
            entries.forEach(({ food, amountGrams }) => {
              onAddMealEntry(mealType, food, amountGrams);
            });
          }
          setAnalysisResult(null);
          setAnalysisImageUrl('');
        }}
      />
    </div>
  );
};
