import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import {
  MealEntry,
  PAUTA_LABELS,
  QUANTITY_LABELS,
  formatPortions,
} from '../types/nutrition';

const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const quantityNumber = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 20,
});

export function MealEntryCard({
  entry,
  onEditQuantity,
  onReviewPauta,
  onRemoveEntry,
}: {
  entry: MealEntry;
  onEditQuantity?: (id: string) => void;
  onReviewPauta?: (id: string) => void;
  onRemoveEntry: (id: string) => void;
}) {
  const matched = entry.pauta?.status === 'matched';
  const free = entry.pauta?.status === 'free';
  const classified = matched || free;
  const quantity = `${quantityNumber.format(
    entry.quantity?.amount ?? entry.amountGrams
  )} ${QUANTITY_LABELS[entry.quantity?.unit ?? 'g']}`;
  const quantityContent = (
    <>
      <span className="block text-xs text-slate-400">Cantidad consumida</span>
      <span className="mt-1 flex items-center gap-2 text-xl font-bold tabular-nums text-slate-100">
        {quantity}
        {onEditQuantity && (
          <Pencil className="size-4 text-emerald-300" aria-hidden="true" />
        )}
      </span>
    </>
  );
  return (
    <article
      aria-label={`Registro de ${entry.foodName}`}
      className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 break-words text-base font-semibold leading-6 text-slate-100">
          {entry.foodName}
        </h4>
        <button
          type="button"
          onClick={() => onRemoveEntry(entry.id)}
          aria-label={`Eliminar ${entry.foodName}`}
          title="Eliminar alimento"
          className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-end">
        <div className="grid grid-cols-2 gap-3">
          {onEditQuantity ? (
            <button
              type="button"
              onClick={() => onEditQuantity(entry.id)}
              aria-label={`Editar cantidad de ${entry.foodName}`}
              title="Editar cantidad consumida"
              className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-2.5 text-left transition hover:border-emerald-300/60 hover:bg-emerald-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {quantityContent}
            </button>
          ) : (
            <div className="rounded-xl border border-slate-800 px-3 py-2.5">
              {quantityContent}
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">
            <span className="block text-xs text-slate-400">
              Energía consumida
            </span>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-100">
              {number.format(entry.calories)}{' '}
              <span className="text-xs font-medium text-slate-400">kcal</span>
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-400">
            Nutrientes en esta cantidad
          </p>
          <dl className="grid grid-cols-3 gap-2">
            {[
              {
                label: 'Proteínas',
                value: entry.protein,
                color: 'text-emerald-300',
              },
              {
                label: 'Carbohidratos',
                value: entry.carbs,
                color: 'text-amber-300',
              },
              { label: 'Grasas', value: entry.fat, color: 'text-rose-300' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="min-w-0 rounded-xl bg-slate-900/80 px-2.5 py-2.5 sm:px-3"
              >
                <dt className="text-[10px] text-slate-400 sm:text-xs">
                  {label}
                </dt>
                <dd
                  className={`mt-1 text-base font-semibold tabular-nums sm:text-lg ${color}`}
                >
                  {number.format(value)}{' '}
                  <span className="text-xs font-normal">g</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {onReviewPauta && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium text-slate-400">
              Aporte a mi pauta
            </p>
            {classified && entry.pauta?.ruleName && (
              <p className="mb-2 text-xs text-slate-500">
                Equivalencia: {entry.pauta.ruleName}
              </p>
            )}
            {matched ? (
              <div className="flex flex-wrap gap-2">
                {entry.pauta?.contributions.map(({ group, portions }) => (
                  <span
                    key={group}
                    className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200"
                  >
                    <strong className="font-semibold">
                      {formatPortions(portions)}
                    </strong>{' '}
                    {portions === 1 ? 'porción' : 'porciones'} de{' '}
                    {PAUTA_LABELS[group].toLowerCase()}
                  </span>
                ))}
              </div>
            ) : free ? (
              <p className="text-xs text-slate-300">Libre según tu pauta</p>
            ) : (
              <p className="text-xs leading-5 text-amber-300">
                Sin equivalencia · aún no suma porciones
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onReviewPauta(entry.id)}
            aria-label={`${
              classified ? 'Cambiar' : 'Asignar'
            } equivalencia de ${entry.foodName}`}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              classified
                ? 'border-slate-600 bg-slate-800/70 text-slate-200 hover:border-emerald-400/50 hover:text-emerald-200'
                : 'border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
            }`}
          >
            <ArrowRightLeft className="size-3.5" aria-hidden="true" />
            {classified ? 'Cambiar equivalencia' : 'Asignar equivalencia'}
          </button>
        </div>
      )}
    </article>
  );
}
