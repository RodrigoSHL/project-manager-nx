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
import { MealTextModal } from './MealTextModal';
import {
  FoodItem,
  MacroGoals,
  MealEntry,
  MealTemplate,
  MealType,
  PlateAnalysisResponse,
} from '../types/nutrition';
import { Camera, Mic, Sparkles, UtensilsCrossed, Zap } from 'lucide-react';

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
  onAddMealEntry: (
    mealType: MealType,
    food: FoodItem,
    amountGrams: number
  ) => Promise<boolean>;
  onAddMultipleMealEntries?: (
    items: Array<{ mealType: MealType; food: FoodItem; amountGrams: number }>
  ) => Promise<boolean>;
  onRemoveMealEntry: (entryId: string) => Promise<boolean>;
  onAddWater: (amountMl: number) => Promise<boolean>;
  onResetWater: () => Promise<boolean>;
  onSaveCustomFood: (
    food: Omit<FoodItem, 'id' | 'isCustom'>
  ) => Promise<boolean>;
  onApplyTemplate: (
    template: MealTemplate,
    mealType?: MealType
  ) => Promise<boolean>;
  onSaveCurrentAsTemplate?: (
    name: string,
    description: string,
    mealType: MealType,
    entries: MealEntry[]
  ) => Promise<boolean>;
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
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(
    null
  );
  const [selectedTemplateMealType, setSelectedTemplateMealType] =
    useState<MealType | null>(null);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);

  // Gemini Vision Plate Analysis State
  const [scanCameraMealType, setScanCameraMealType] = useState<MealType | null>(
    null
  );
  const [analysisResult, setAnalysisResult] =
    useState<PlateAnalysisResponse | null>(null);
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string>('');
  const [analysisTargetMeal, setAnalysisTargetMeal] =
    useState<MealType>('lunch');
  const [textEntryMeal, setTextEntryMeal] = useState<MealType | 'auto' | null>(
    null
  );
  const [analysisText, setAnalysisText] = useState('');

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
      {goals.distributionPreset === 'meds_pauta' && goals.pautaPortions && (
        <PautaSummaryCard
          targets={goals.pautaPortions}
          consumed={consumedPortions}
        />
      )}

      {/* 2. Anillo Central de Calorías y Barras de Macronutrientes (Gramos) */}
      <MacroProgressRings goals={goals} consumed={consumedTotals} />

      {/* 3. Tarjeta de Hidratación (> 2 Litros según pauta) */}
      <WaterTrackerCard
        currentMl={waterIntakeMl}
        targetMl={goals.waterTargetMl}
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
                <h3 className="text-sm font-bold text-white">
                  Registrar comida con IA
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Foto · Texto · Voz
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Sube una foto o cuenta qué comiste. Revisa los ingredientes y
                ajusta los gramos antes de registrar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTextEntryMeal('auto')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              <Mic className="w-4 h-4" />
              <span>Escribir / Dictar comida</span>
            </button>
            <button
              onClick={() => setScanCameraMealType('lunch')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Cámara / Foto</span>
            </button>
          </div>
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
          subtitle={
            goals.distributionPreset === 'meds_pauta'
              ? 'Pauta: 1 Carb + 2 Prot + ½ Grasa + 1 Lácteo'
              : 'Registra tus alimentos y cantidades'
          }
          icon="🌅"
          entries={breakfastMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Mañana */}
        <MealSection
          mealType="colacion_am"
          title="Colación Mañana"
          subtitle={
            goals.distributionPreset === 'meds_pauta'
              ? 'Pauta: 1 Fruta entera + 1 Lácteo'
              : 'Registra tus alimentos y cantidades'
          }
          icon="🍏"
          entries={colacionAmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 2: Almuerzo */}
        <MealSection
          mealType="lunch"
          title="Comida 2: Almuerzo"
          subtitle={
            goals.distributionPreset === 'meds_pauta'
              ? 'Pauta: Verduras libre + 4 Prot (200g) + 1 Carb + 1 Grasa + 1 Fruta'
              : 'Registra tus alimentos y cantidades'
          }
          icon="☀️"
          entries={lunchMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Tarde */}
        <MealSection
          mealType="colacion_pm"
          title="Colación Tarde"
          subtitle={
            goals.distributionPreset === 'meds_pauta'
              ? 'Pauta: 1 Fruta + 1 Carbohidrato + 1 Lácteo'
              : 'Registra tus alimentos y cantidades'
          }
          icon="🥪"
          entries={colacionPmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 3: Cena */}
        <MealSection
          mealType="dinner"
          title="Comida 3: Cena"
          subtitle={
            goals.distributionPreset === 'meds_pauta'
              ? 'Pauta: Verduras libre + 4 Prot (200g) + 1 Carb + ½ Grasa'
              : 'Registra tus alimentos y cantidades'
          }
          icon="🌙"
          entries={dinnerMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
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
            onOpenTextMeal={(type) => setTextEntryMeal(type)}
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

      {/* Text and voice use the same review and confirmation flow as photos. */}
      {textEntryMeal && (
        <MealTextModal
          defaultMealType={textEntryMeal === 'auto' ? undefined : textEntryMeal}
          onClose={() => setTextEntryMeal(null)}
          onAnalysisSuccess={(analysis, text, targetMeal) => {
            setAnalysisResult(analysis);
            setAnalysisImageUrl('');
            setAnalysisText(text);
            setAnalysisTargetMeal(targetMeal);
          }}
        />
      )}
      <PlateCameraModal
        isOpen={scanCameraMealType !== null}
        defaultMealType={scanCameraMealType || 'lunch'}
        onClose={() => setScanCameraMealType(null)}
        onAnalysisSuccess={(analysis, imageUrl, targetMeal) => {
          setAnalysisResult(analysis);
          setAnalysisImageUrl(imageUrl);
          setAnalysisText('');
          setAnalysisTargetMeal(targetMeal);
        }}
      />

      {/* Modal: AI Plate Analysis Breakdown & 1-Tap Gram Adjustment */}
      <PlateAnalysisResultModal
        isOpen={analysisResult !== null}
        analysis={analysisResult}
        imageUrl={analysisImageUrl}
        descriptionText={analysisText}
        defaultMealType={analysisTargetMeal}
        onClose={() => {
          setAnalysisResult(null);
          setAnalysisImageUrl('');
        }}
        onConfirmPlate={async (entries, mealType) => {
          const saved = onAddMultipleMealEntries
            ? await onAddMultipleMealEntries(
                entries.map(({ food, amountGrams }) => ({
                  mealType,
                  food,
                  amountGrams,
                }))
              )
            : (
                await Promise.all(
                  entries.map(({ food, amountGrams }) =>
                    onAddMealEntry(mealType, food, amountGrams)
                  )
                )
              ).every(Boolean);
          if (saved) {
            setAnalysisResult(null);
            setAnalysisImageUrl('');
          }
          return saved;
        }}
      />
    </div>
  );
};
