import { ArrowRightLeft, ChevronDown, Pencil, Trash2 } from 'lucide-react';
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
const action =
  'grid size-11 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2';

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
  const contributions = entry.pauta?.contributions
    .map(
      ({ group, portions }) =>
        `${formatPortions(portions)} porc. de ${PAUTA_LABELS[
          group
        ].toLowerCase()}`
    )
    .join(' + ');
  return (
    <article
      aria-label={`Registro de ${entry.foodName}`}
      className="rounded-xl border border-slate-700/60 bg-slate-950/45 px-3 py-2 sm:px-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:gap-x-4">
        <div className="min-w-0 self-center">
          <h4 className="break-words text-sm font-semibold leading-5 text-slate-100">
            {entry.foodName}
          </h4>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs tabular-nums">
            <span className="text-slate-300">
              <span className="sr-only">Cantidad consumida: </span>
              {quantity}
            </span>
            <span className="text-slate-600" aria-hidden>
              ·
            </span>
            <span className="font-semibold text-slate-100">
              <span className="sr-only">Energía consumida: </span>
              {number.format(entry.calories)}{' '}
              <span className="font-normal text-slate-400">kcal</span>
            </span>
          </p>
        </div>
        <dl
          aria-label="Nutrientes en esta cantidad"
          className="col-span-2 row-start-2 grid grid-cols-3 gap-x-3 pb-0.5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:self-center sm:pb-0"
        >
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
            <div key={label} className="min-w-0">
              <dt className="text-[10px] leading-4 text-slate-400">{label}</dt>
              <dd
                className={`text-sm font-semibold tabular-nums leading-5 ${color}`}
              >
                {number.format(value)}{' '}
                <span className="text-xs font-normal">g</span>
              </dd>
            </div>
          ))}
        </dl>
        <div
          role="group"
          aria-label={`Acciones de ${entry.foodName}`}
          className="col-start-2 row-start-1 flex items-center gap-1 sm:col-start-3"
        >
          {onEditQuantity && (
            <button
              type="button"
              onClick={() => onEditQuantity(entry.id)}
              aria-label={`Editar cantidad de ${entry.foodName}`}
              title="Editar cantidad consumida"
              className={`${action} border-emerald-400/20 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/15 focus-visible:ring-emerald-300`}
            >
              <Pencil size={16} aria-hidden />
            </button>
          )}
          {onReviewPauta && (
            <button
              type="button"
              onClick={() => onReviewPauta(entry.id)}
              aria-label={`${
                classified ? 'Cambiar' : 'Asignar'
              } equivalencia de ${entry.foodName}`}
              title={
                classified
                  ? 'Cambiar equivalencia de pauta'
                  : 'Asignar equivalencia de pauta'
              }
              className={`${action} ${
                classified
                  ? 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:text-emerald-200'
                  : 'border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
              } focus-visible:ring-emerald-300`}
            >
              <ArrowRightLeft size={16} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemoveEntry(entry.id)}
            aria-label={`Eliminar ${entry.foodName}`}
            title="Eliminar alimento"
            className={`${action} border-transparent text-slate-500 hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300 focus-visible:ring-rose-300`}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>
      {onReviewPauta && (
        <details className="group/pauta mt-1 border-t border-slate-800/80">
          <summary
            aria-label={`Detalle de pauta de ${entry.foodName}`}
            className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 [&::-webkit-details-marker]:hidden"
          >
            <span className="min-w-0">
              <span className="text-slate-500">Pauta · </span>
              <span
                className={classified ? 'text-emerald-200' : 'text-amber-300'}
              >
                {matched
                  ? contributions
                  : free
                  ? 'Libre según tu pauta'
                  : 'Pendiente de clasificar'}
              </span>
            </span>
            <ChevronDown
              size={14}
              aria-hidden
              className="shrink-0 text-slate-500 transition-transform group-open/pauta:rotate-180"
            />
          </summary>
          <div className="mb-1 rounded-lg bg-slate-900/60 px-3 py-2 text-xs leading-5">
            <p className="font-semibold text-slate-300">Aporte a mi pauta</p>
            {classified && entry.pauta?.ruleName && (
              <p className="mt-1 text-slate-400">
                Equivalencia: {entry.pauta.ruleName}
              </p>
            )}
            {matched ? (
              <ul className="mt-1 text-emerald-200">
                {entry.pauta?.contributions.map(({ group, portions }) => (
                  <li key={group}>
                    {formatPortions(portions)}{' '}
                    {portions === 1 ? 'porción' : 'porciones'} de{' '}
                    {PAUTA_LABELS[group].toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : free ? (
              <p className="mt-1 text-slate-300">Libre según tu pauta</p>
            ) : (
              <p className="mt-1 text-amber-300">
                Sin equivalencia · aún no suma porciones. Usa el botón de las
                flechas para clasificarlo.
              </p>
            )}
          </div>
        </details>
      )}
    </article>
  );
}
