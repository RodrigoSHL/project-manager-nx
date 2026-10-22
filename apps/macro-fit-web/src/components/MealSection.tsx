import { Camera, Plus, Trash2, Utensils, Zap } from 'lucide-react';
import { MealEntry, MealType } from '../types/nutrition';

interface MealSectionProps {
  mealType: MealType;
  title: string;
  subtitle: string;
  icon: string;
  entries: MealEntry[];
  onOpenAddFood: (mealType: MealType) => void;
  onOpenTemplates?: (mealType: MealType) => void;
  onOpenScanPlate?: (mealType: MealType) => void;
  onRemoveEntry: (entryId: string) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  title,
  subtitle,
  icon,
  entries,
  onOpenAddFood,
  onOpenTemplates,
  onOpenScanPlate,
  onRemoveEntry,
}) => {
  const mealTotals = entries.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-sm transition hover:border-slate-700/80">
      {/* Meal Header */}
      <div className="p-3.5 sm:p-4 bg-slate-950/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl select-none">{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-extrabold text-white">{mealTotals.calories} kcal</span>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400 font-medium">P:{mealTotals.protein.toFixed(0)}g</span>
                <span>•</span>
                <span className="text-amber-400 font-medium">C:{mealTotals.carbs.toFixed(0)}g</span>
                <span>•</span>
                <span className="text-rose-400 font-medium">G:{mealTotals.fat.toFixed(0)}g</span>
              </div>
            </div>
          )}

          {onOpenScanPlate && (
            <button
              onClick={() => onOpenScanPlate(mealType)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition active:scale-95"
              title="Escanear plato con IA (Gemini Vision)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escanear</span>
            </button>
          )}

          {onOpenTemplates && (
            <button
              onClick={() => onOpenTemplates(mealType)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition active:scale-95"
              title="Cargar combo precargado (arroz + proteína, porridge, etc.)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Combos</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddFood(mealType)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="p-3 space-y-2">
        {entries.length === 0 ? (
          <div className="py-4 text-center">
            <Utensils className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500">No hay alimentos registrados en {title.toLowerCase()}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                onClick={() => onOpenAddFood(mealType)}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                + Agregar alimento
              </button>
              {onOpenScanPlate && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => onOpenScanPlate(mealType)}
                    className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Escanear con IA</span>
                  </button>
                </>
              )}
              {onOpenTemplates && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => onOpenTemplates(mealType)}
                    className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Cargar combo habitual</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950/30 hover:bg-slate-800/40 border border-slate-800/40 transition"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 truncate">{entry.foodName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium flex-shrink-0">
                    {entry.amountGrams}g
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                  <span className="text-emerald-400">P: {entry.protein}g</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400">C: {entry.carbs}g</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-rose-400">G: {entry.fat}g</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">{entry.calories} kcal</span>
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="p-1 rounded text-slate-600 hover:text-rose-400 transition"
                  title="Eliminar alimento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
