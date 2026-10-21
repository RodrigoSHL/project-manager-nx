import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Plus,
  Minus,
  Utensils,
  Lightbulb,
  CheckCircle2,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import {
  AnalyzedPlateItem,
  FoodCategory,
  FoodItem,
  MealEntry,
  MealType,
  PlateAnalysisResponse,
} from '../types/nutrition';

interface PlateAnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: PlateAnalysisResponse | null;
  imageUrl?: string;
  defaultMealType: MealType;
  onConfirmPlate: (entries: Array<{ food: FoodItem; amountGrams: number }>, mealType: MealType) => void;
}

const CATEGORY_MAP: Record<
  FoodCategory,
  { label: string; bg: string; text: string; border: string; group: FoodItem['category'] }
> = {
  proteina: {
    label: 'Proteína',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    group: 'protein',
  },
  carbohidrato: {
    label: 'Carbohidrato',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    group: 'carbs',
  },
  grasa: {
    label: 'Grasa',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    group: 'fats',
  },
  verdura: {
    label: 'Verdura',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    group: 'fruits_veggies',
  },
  fruta: {
    label: 'Fruta',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
    group: 'fruits_veggies',
  },
  lacteo: {
    label: 'Lácteo',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    group: 'dairy',
  },
  legumbre: {
    label: 'Legumbre',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    group: 'protein',
  },
};

const MEAL_NAMES: Record<MealType, string> = {
  breakfast: '🌅 Desayuno',
  colacion_am: '🍏 Colación Mañana',
  lunch: '☀️ Almuerzo',
  colacion_pm: '🥪 Colación Tarde',
  dinner: '🌙 Cena',
  snacks: '🍎 Snacks / Libre',
};

export const PlateAnalysisResultModal: React.FC<PlateAnalysisResultModalProps> = ({
  isOpen,
  onClose,
  analysis,
  imageUrl,
  defaultMealType,
  onConfirmPlate,
}) => {
  if (!isOpen || !analysis) return null;

  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMealType);
  const [items, setItems] = useState<AnalyzedPlateItem[]>(() =>
    analysis.items.map((item, idx) => ({
      ...item,
      id: `plate-item-${idx}-${Date.now()}`,
      adjusted_grams: item.estimated_grams || 100,
      selected: true,
    }))
  );

  const handleToggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  const handleAdjustGrams = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const nextVal = Math.max(10, Math.round(i.adjusted_grams + delta));
          return { ...i, adjusted_grams: nextVal };
        }
        return i;
      })
    );
  };

  const handleDirectGramsChange = (id: string, grams: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, adjusted_grams: Math.max(5, grams || 0) } : i
      )
    );
  };

  // Instant recalculation using nutritional_density_per_100g
  const activeItems = items.filter((i) => i.selected);

  const totals = activeItems.reduce(
    (acc, curr) => {
      const factor = curr.adjusted_grams / 100;
      const density = curr.nutritional_density_per_100g;
      return {
        calories: acc.calories + Math.round((density.kcal || 0) * factor),
        protein: acc.protein + (density.protein_g || 0) * factor,
        carbs: acc.carbs + (density.carbs_g || 0) * factor,
        fat: acc.fat + (density.fat_g || 0) * factor,
        fiber: acc.fiber + (density.fiber_g || 0) * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const handleConfirm = () => {
    const confirmedList = activeItems.map((item) => {
      const density = item.nutritional_density_per_100g;
      const factor = item.adjusted_grams / 100;
      const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.proteina;

      const syntheticFood: FoodItem = {
        id: `ia-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        servingUnit: `${item.adjusted_grams}g`,
        servingSizeGrams: item.adjusted_grams,
        calories: Math.round((density.kcal || 0) * factor),
        protein: Number(((density.protein_g || 0) * factor).toFixed(1)),
        carbs: Number(((density.carbs_g || 0) * factor).toFixed(1)),
        fat: Number(((density.fat_g || 0) * factor).toFixed(1)),
        fiber: Number(((density.fiber_g || 0) * factor).toFixed(1)),
        category: catConfig.group,
        isCustom: true,
        notes: `Analizado con Gemini Vision (${item.confidence} confianza)`,
      };

      return {
        food: syntheticFood,
        amountGrams: item.adjusted_grams,
      };
    });

    onConfirmPlate(confirmedList, targetMeal);
    onClose();
  };

  const plateTypeLabel =
    analysis.plate_type_detected === 'plato_extendido'
      ? '🍽️ Plato Extendido (25 cm)'
      : analysis.plate_type_detected === 'plato_hondo'
      ? '🍲 Plato Hondo'
      : '🥣 Bowl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {analysis.dish_name || 'Desglose del Plato Detectado'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">{plateTypeLabel}</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {analysis.items.length} ingredientes detectados
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Dish Overview & Image Thumbnail */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Plato analizado"
                className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Ajuste fino del usuario (1 toque)
              </span>
              <p className="text-xs text-slate-300 leading-snug">
                Confirma o ajusta los gramos con los botones <span className="text-emerald-400 font-bold">+</span> y <span className="text-emerald-400 font-bold">-</span> para calibrar la profundidad 2D.
              </p>
            </div>
          </div>

          {/* Clinical Tip Banner */}
          {analysis.clinical_tip && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-indigo-300 block mb-0.5">Tip Clínico Nutricional:</span>
                <p className="text-slate-300 leading-relaxed">{analysis.clinical_tip}</p>
              </div>
            </div>
          )}

          {/* Food Items List with 1-Tap Gram Adjustment */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-slate-300">Ingredientes y Porciones</span>
              <span>Gramos & Macros</span>
            </div>

            {items.map((item) => {
              const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.proteina;
              const factor = item.adjusted_grams / 100;
              const density = item.nutritional_density_per_100g;
              const itemKcal = Math.round((density.kcal || 0) * factor);
              const itemProt = ((density.protein_g || 0) * factor).toFixed(1);
              const itemCarbs = ((density.carbs_g || 0) * factor).toFixed(1);
              const itemFat = ((density.fat_g || 0) * factor).toFixed(1);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition ${
                    item.selected
                      ? 'bg-slate-950/80 border-slate-750 shadow-sm'
                      : 'bg-slate-950/30 border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Checkbox & Name */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition border ${
                          item.selected
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}
                          >
                            {catConfig.label}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Confianza: {item.confidence}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Caloric & Macro Density Preview */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 block">
                        {itemKcal} kcal
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {itemProt}p · {itemCarbs}c · {itemFat}g
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Gram Adjustment Stepper */}
                  {item.selected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(item.id, -25)}
                          className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 transition active:scale-95 border border-slate-700/50"
                          title="Restar 25 gramos"
                        >
                          -25g
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(item.id, -10)}
                          className="p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition active:scale-95 border border-slate-700/50"
                          title="Restar 10 gramos"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Grams Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.adjusted_grams}
                          onChange={(e) =>
                            handleDirectGramsChange(item.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 text-center font-bold text-xs bg-slate-900 border border-slate-700 rounded-lg py-1 text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs text-slate-400 font-semibold">g</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(item.id, 10)}
                          className="p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition active:scale-95 border border-slate-700/50"
                          title="Sumar 10 gramos"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(item.id, 25)}
                          className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 transition active:scale-95 border border-slate-700/50"
                          title="Sumar 25 gramos"
                        >
                          +25g
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary & Confirmation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          {/* Dynamic Macro Totals Bar */}
          <div className="grid grid-cols-4 gap-2 text-center bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Kcal</span>
              <span className="text-sm font-extrabold text-emerald-400">
                {totals.calories}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block">Proteína</span>
              <span className="text-xs font-bold text-white">
                {totals.protein.toFixed(1)}g
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block">Carbohidratos</span>
              <span className="text-xs font-bold text-white">
                {totals.carbs.toFixed(1)}g
              </span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 block">Grasas</span>
              <span className="text-xs font-bold text-white">
                {totals.fat.toFixed(1)}g
              </span>
            </div>
          </div>

          {/* Target Meal Selector & Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={targetMeal}
                onChange={(e) => setTargetMeal(e.target.value as MealType)}
                className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white appearance-none pr-8 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="breakfast">🌅 Desayuno</option>
                <option value="colacion_am">🍏 Colación AM</option>
                <option value="lunch">☀️ Almuerzo</option>
                <option value="colacion_pm">🥪 Colación PM</option>
                <option value="dinner">🌙 Cena</option>
                <option value="snacks">🍎 Snacks</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={activeItems.length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Confirmar y Registrar en {MEAL_NAMES[targetMeal].split(' ')[1] || 'Comida'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
