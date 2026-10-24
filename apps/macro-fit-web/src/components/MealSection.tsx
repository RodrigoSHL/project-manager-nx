import { useEffect, useId, useRef, useState } from 'react';
import { Camera, ChevronDown, Mic, Plus, Utensils, Zap } from 'lucide-react';
import { MealEntry, MealType } from '../types/nutrition';
import { MealEntryCard } from './MealEntryCard';

interface MealSectionProps {
  mealType: MealType;
  title: string;
  subtitle: string;
  icon: string;
  entries: MealEntry[];
  onOpenAddFood: (mealType: MealType) => void;
  onOpenTemplates?: (mealType: MealType) => void;
  onOpenScanPlate?: (mealType: MealType) => void;
  onOpenTextMeal?: (mealType: MealType) => void;
  onReviewPauta?: (entryId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onEditQuantity?: (entryId: string) => void;
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
  onOpenTextMeal,
  onReviewPauta,
  onRemoveEntry,
  onEditQuantity,
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const previousCount = useRef(entries.length);
  useEffect(() => {
    if (entries.length > previousCount.current) setExpanded(true);
    previousCount.current = entries.length;
  }, [entries.length]);
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
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-sm transition hover:border-slate-700"
    >
      <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <h3 id={headingId} className="min-w-0 flex-1 basis-32">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${title}`}
            className="flex min-h-11 w-full items-center gap-2 sm:gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span
              className="grid size-9 sm:size-11 shrink-0 place-items-center rounded-xl bg-slate-950/70 text-lg sm:text-xl"
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-bold text-slate-100">
                {title}
              </span>
              <span className="mt-1 block text-[11px] font-normal text-slate-500">
                {entries.length
                  ? `${entries.length} ${
                      entries.length === 1 ? 'alimento' : 'alimentos'
                    } · ${mealTotals.calories} kcal`
                  : 'Sin registros todavía'}
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-slate-500 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </h3>
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={`Acciones de ${title}`}
        >
          {onOpenTextMeal && (
            <button
              type="button"
              onClick={() => onOpenTextMeal(mealType)}
              aria-label={`Describir comida: ${title}`}
              title="Texto o voz"
              className="grid size-10 place-items-center rounded-xl border border-teal-400/40 bg-teal-400/15 text-teal-200 transition hover:bg-teal-400/25 focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <Mic className="size-4" aria-hidden="true" />
            </button>
          )}
          {onOpenScanPlate && (
            <button
              type="button"
              onClick={() => onOpenScanPlate(mealType)}
              aria-label={`Escanear plato: ${title}`}
              title="Escanear plato"
              className="grid size-10 place-items-center rounded-xl border border-indigo-400/40 bg-indigo-400/15 text-indigo-200 transition hover:bg-indigo-400/25 focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Camera className="size-4" aria-hidden="true" />
            </button>
          )}
          {onOpenTemplates && (
            <button
              type="button"
              onClick={() => onOpenTemplates(mealType)}
              aria-label={`Combos: ${title}`}
              title="Combos"
              className="grid size-10 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 transition hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Zap className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAddFood(mealType)}
            aria-label={`Agregar alimento: ${title}`}
            title="Agregar alimento"
            className="grid size-10 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        id={panelId}
        hidden={!expanded}
        className="space-y-2 border-t border-slate-800/70 p-3 sm:p-4"
      >
        <p className="sr-only">{subtitle}</p>
        {entries.length > 0 && (
          <div className="mb-2 rounded-xl border border-slate-700/50 bg-slate-800/30 p-2.5 sm:p-3">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-300">
              Total consumido en {title.toLowerCase()}
            </p>
            <dl className="grid grid-cols-4 gap-x-2 sm:gap-x-4">
              {[
                {
                  label: 'Energía',
                  value: mealTotals.calories,
                  unit: 'kcal',
                  color: 'text-slate-100',
                },
                {
                  label: 'Proteínas',
                  value: mealTotals.protein,
                  unit: 'g',
                  color: 'text-emerald-300',
                },
                {
                  label: 'Carbohidratos',
                  value: mealTotals.carbs,
                  unit: 'g',
                  color: 'text-amber-300',
                },
                {
                  label: 'Grasas',
                  value: mealTotals.fat,
                  unit: 'g',
                  color: 'text-rose-300',
                },
              ].map(({ label, value, unit, color }) => (
                <div key={label}>
                  <dt className="text-[10px] text-slate-400 sm:text-xs">
                    {label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-sm font-semibold tabular-nums sm:text-base ${color}`}
                  >
                    {new Intl.NumberFormat('es-CL', {
                      maximumFractionDigits: 1,
                    }).format(value)}{' '}
                    <span className="text-xs font-normal">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {entries.length === 0 ? (
          <div className="py-4 text-center">
            <Utensils
              className="mx-auto mb-2 size-6 text-slate-700"
              aria-hidden="true"
            />
            <p className="text-xs text-slate-500">
              Aún no registras alimentos en {title.toLowerCase()}. Usa las
              acciones de arriba para agregar tu comida.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <MealEntryCard
              key={entry.id}
              entry={entry}
              onEditQuantity={onEditQuantity}
              onReviewPauta={onReviewPauta}
              onRemoveEntry={onRemoveEntry}
            />
          ))
        )}
      </div>
    </section>
  );
};
