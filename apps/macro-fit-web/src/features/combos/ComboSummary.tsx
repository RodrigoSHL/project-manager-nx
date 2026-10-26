import { MealType, PAUTA_LABELS, formatPortions } from '../../types/nutrition';
import { previewMealTemplate } from '../../utils/mealTemplates';

export const COMBO_MEALS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  colacion_am: 'Colación mañana',
  lunch: 'Almuerzo',
  colacion_pm: 'Colación tarde',
  dinner: 'Cena',
  snacks: 'Snacks / extra',
};
export const comboNumber = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});
export const comboInput =
  'mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400';

export function ComboSummary({
  preview,
  showPauta = false,
}: {
  preview: ReturnType<typeof previewMealTemplate>;
  showPauta?: boolean;
}) {
  return (
    <div>
      {preview.totals ? (
        <dl className="grid grid-cols-4 gap-2 text-xs">
          {(
            [
              ['Energía', preview.totals.calories, 'kcal', 'text-slate-100'],
              ['Proteínas', preview.totals.protein, 'g', 'text-emerald-300'],
              ['Carbos', preview.totals.carbs, 'g', 'text-amber-300'],
              ['Grasas', preview.totals.fat, 'g', 'text-rose-300'],
            ] as const
          ).map(([label, value, unit, color]) => (
            <div key={label}>
              <dt className="text-[10px] text-slate-400 sm:text-xs">{label}</dt>
              <dd className={`mt-1 font-semibold tabular-nums ${color}`}>
                {comboNumber.format(value)}{' '}
                <span className="text-[10px] font-normal">{unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-amber-200">
          {preview.items.length
            ? 'Revisa los alimentos y sus cantidades para calcular el total.'
            : 'Agrega alimentos para calcular el combo.'}
        </p>
      )}
      {showPauta && preview.complete && (
        <div className="mt-3 border-t border-slate-800 pt-2 text-xs leading-5 text-slate-400">
          {preview.portions.length > 0 && (
            <p className="text-teal-200">
              {preview.portions
                .map(
                  (item) =>
                    `${formatPortions(item.portions)} ${
                      PAUTA_LABELS[item.group]
                    }`
                )
                .join(' · ')}
            </p>
          )}
          {preview.pending > 0 && (
            <p className="text-amber-200">
              {preview.pending} alimento(s) pendiente(s) de clasificar en la
              pauta de este día.
            </p>
          )}
          {!preview.pending && !preview.portions.length && (
            <p>
              Sin sumar porciones según las referencias libres de esta pauta.
              Los nutrientes sí cuentan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
