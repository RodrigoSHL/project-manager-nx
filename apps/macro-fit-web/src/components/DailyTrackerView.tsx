import React, { useCallback, useState } from 'react';
import { MacroProgressRings } from './MacroProgressRings';
import { FoodGuideShortcut } from '../features/food-guide/FoodGuideView';
import { PautaSummaryCard } from './PautaSummaryCard';
import { MealSection } from './MealSection';
import { WaterTrackerCard } from './WaterTrackerCard';
import { FoodSelectorModal } from './FoodSelectorModal';
import { CustomFoodModal } from './CustomFoodModal';
import { MealTemplatesModal } from './MealTemplatesModal';
import { PlateCameraModal } from './PlateCameraModal';
import { PlateAnalysisResultModal } from './PlateAnalysisResultModal';
import { SuggestEquivalences } from './EquivalenceSuggestionsPanel';
import { ClassifyMealModal } from './ClassifyMealModal';
import { EditMealQuantityModal } from './EditMealQuantityModal';
import { MealTextModal } from './MealTextModal';
import {
  FoodItem,
  UpdateMealQuantity,
  ProductEquivalenceInput,
  MacroGoals,
  MealEntry,
  MealTemplate,
  MealType,
  PlateAnalysisResponse,
  NutritionPlan,
  PautaSelection,
  summarizePauta,
  isNutritionPlanConfigured,
} from '../types/nutrition';
import { Camera, Mic, Sparkles, UtensilsCrossed } from 'lucide-react';

interface DailyTrackerViewProps {
  onOpenFoodGuide?: () => void;
  goals: MacroGoals;
  meals: MealEntry[];
  consumedTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionPlan?: NutritionPlan | null;
  portionSummary?: ReturnType<typeof summarizePauta> | null;
  onClassifyMeal?: (id: string, selection: PautaSelection) => Promise<boolean>;
  onOpenPlan?: () => void;
  onSuggestEquivalences?: SuggestEquivalences;
  catalogPlan?: NutritionPlan | null;
  products?: FoodItem[];
  onOpenProducts?: () => void;
  onClassifyProduct?: (
    id: string,
    input: ProductEquivalenceInput
  ) => Promise<boolean>;
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
  onUpdateMealQuantity?: (
    entryId: string,
    input: UpdateMealQuantity
  ) => Promise<boolean>;
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
  onOpenFoodGuide,
  goals,
  meals,
  consumedTotals,
  nutritionPlan,
  portionSummary,
  onClassifyMeal,
  onOpenPlan,
  catalogPlan,
  products = [],
  onOpenProducts,
  onClassifyProduct,
  onSuggestEquivalences,
  waterIntakeMl,
  allFoods,
  allTemplates,
  onAddMealEntry,
  onAddMultipleMealEntries,
  onRemoveMealEntry,
  onUpdateMealQuantity,
  onAddWater,
  onResetWater,
  onSaveCustomFood,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  onOpenCalculator,
}) => {
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const closeQuantityEditor = useCallback(() => setEditingEntry(null), []);
  const openQuantityEditor = onUpdateMealQuantity
    ? (id: string) =>
        setEditingEntry(meals.find((meal) => meal.id === id) ?? null)
    : undefined;
  const readyPlan = nutritionPlan && isNutritionPlanConfigured(nutritionPlan);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const reviewing = meals.find((meal) => meal.id === reviewingId);
  const closeReview = useCallback(() => setReviewingId(null), []);
  const openReview = (id: string) => setReviewingId(id);
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
    <div className="space-y-6 mx-auto pb-8 animate-in fade-in duration-300">
      {onOpenFoodGuide && <FoodGuideShortcut onOpen={onOpenFoodGuide} />}
      {nutritionPlan && portionSummary ? (
        <>
          <PautaSummaryCard
            plan={nutritionPlan}
            summary={portionSummary}
            onConfigure={() => onOpenPlan?.()}
          />
          {readyPlan && portionSummary.pending > 0 && (
            <div className="flex flex-wrap gap-2">
              {meals
                .filter(
                  (meal) =>
                    !meal.pauta ||
                    meal.pauta.status === 'pending' ||
                    meal.pauta.planVersion !== nutritionPlan.version
                )
                .map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => openReview(meal.id)}
                    className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-200"
                  >
                    Clasificar: {meal.foodName}
                  </button>
                ))}
            </div>
          )}
        </>
      ) : (
        onOpenPlan && (
          <button
            onClick={onOpenPlan}
            className="w-full rounded-xl border border-emerald-500/30 bg-slate-900 p-4 text-left text-sm text-emerald-300"
          >
            Configurar mi pauta de porciones
          </button>
        )
      )}

      {/* 2. Anillo Central de Calorías y Barras de Macronutrientes (Gramos) */}
      <MacroProgressRings goals={goals} consumed={consumedTotals} />

      {/* 3. Tarjeta de Hidratación (> 2 Litros según pauta) */}
      <WaterTrackerCard
        currentMl={waterIntakeMl}
        targetMl={nutritionPlan?.waterTargetMl ?? goals.waterTargetMl}
        isMinimum={nutritionPlan?.waterIsMinimum}
        onAddWater={onAddWater}
        onResetWater={onResetWater}
      />

      <section
        aria-labelledby="quick-analysis-title"
        className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-indigo-500/10 p-5 sm:p-6"
      >
        <div className="min-w-0">
          <h3
            id="quick-analysis-title"
            className="flex items-center gap-2 text-base font-semibold text-slate-100"
          >
            <Sparkles className="size-5 text-emerald-300" aria-hidden="true" />
            Registrar comida con IA
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            Usa una foto o describe tu comida con texto o voz. Tú revisas las
            cantidades antes de guardar.
          </p>
        </div>
        <div
          role="group"
          aria-label="Registrar comida con inteligencia artificial"
          className="flex shrink-0 items-center gap-3"
        >
          <button
            type="button"
            onClick={() => setTextEntryMeal('auto')}
            aria-label="Escribir / Dictar comida"
            title="Escribir o dictar comida"
            className="grid size-14 place-items-center rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/15 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:size-16"
          >
            <Mic className="size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setScanCameraMealType('lunch')}
            aria-label="Abrir Cámara / Foto"
            title="Analizar una foto de comida"
            className="grid size-14 place-items-center rounded-2xl border border-indigo-300/50 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:size-16"
          >
            <Camera className="size-6" aria-hidden="true" />
          </button>
        </div>
      </section>

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
          title="Desayuno"
          subtitle="Registra tus alimentos y cantidades"
          icon="🌅"
          entries={breakfastMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onReviewPauta={readyPlan ? openReview : undefined}
          onEditQuantity={openQuantityEditor}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Mañana */}
        <MealSection
          mealType="colacion_am"
          title="Colación Mañana"
          subtitle="Registra tus alimentos y cantidades"
          icon="🍏"
          entries={colacionAmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onReviewPauta={readyPlan ? openReview : undefined}
          onEditQuantity={openQuantityEditor}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 2: Almuerzo */}
        <MealSection
          mealType="lunch"
          title="Almuerzo"
          subtitle="Registra tus alimentos y cantidades"
          icon="☀️"
          entries={lunchMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onReviewPauta={readyPlan ? openReview : undefined}
          onEditQuantity={openQuantityEditor}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Colación Tarde */}
        <MealSection
          mealType="colacion_pm"
          title="Colación Tarde"
          subtitle="Registra tus alimentos y cantidades"
          icon="🥪"
          entries={colacionPmMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onReviewPauta={readyPlan ? openReview : undefined}
          onEditQuantity={openQuantityEditor}
          onRemoveEntry={onRemoveMealEntry}
        />

        {/* Comida 3: Cena */}
        <MealSection
          mealType="dinner"
          title="Cena"
          subtitle="Registra tus alimentos y cantidades"
          icon="🌙"
          entries={dinnerMeals}
          onOpenAddFood={(type) => setSelectedMealType(type)}
          onOpenTemplates={(type) => setSelectedTemplateMealType(type)}
          onOpenScanPlate={(type) => setScanCameraMealType(type)}
          onOpenTextMeal={(type) => setTextEntryMeal(type)}
          onReviewPauta={readyPlan ? openReview : undefined}
          onEditQuantity={openQuantityEditor}
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
            onReviewPauta={readyPlan ? openReview : undefined}
            onEditQuantity={openQuantityEditor}
            onRemoveEntry={onRemoveMealEntry}
          />
        )}
      </div>

      {editingEntry && onUpdateMealQuantity && (
        <EditMealQuantityModal
          entry={editingEntry}
          onSave={onUpdateMealQuantity}
          onClose={closeQuantityEditor}
        />
      )}

      {reviewing && nutritionPlan && onClassifyMeal && (
        <ClassifyMealModal
          key={reviewing.id}
          entry={reviewing}
          plan={nutritionPlan}
          catalogPlan={catalogPlan ?? nutritionPlan}
          products={products}
          onSave={onClassifyMeal}
          onSaveProduct={onClassifyProduct}
          onSuggest={onSuggestEquivalences}
          onClose={closeReview}
          onOpenProducts={
            onOpenProducts
              ? () => {
                  closeReview();
                  onOpenProducts();
                }
              : undefined
          }
        />
      )}

      {/* Modal: Select & Scale Single Food */}
      <FoodSelectorModal
        isOpen={selectedMealType !== null}
        mealType={selectedMealType}
        foods={allFoods}
        nutritionPlan={nutritionPlan}
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
        nutritionPlan={nutritionPlan}
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
