import { useId, useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import {
  NutritionPlan,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  formatPortions,
  summarizePauta,
  isNutritionPlanConfigured,
} from '../types/nutrition';

export function PautaSummaryCard({
  plan,
  summary,
  onConfigure,
}: {
  plan: NutritionPlan;
  summary: ReturnType<typeof summarizePauta>;
  onConfigure: () => void;
}) {
  const [details, setDetails] = useState(false);
  const detailId = useId();
  if (!isNutritionPlanConfigured(plan))
    return (
      <section className="space-y-3 rounded-2xl border border-amber-500/40 bg-slate-900 p-4">
        <h2 className="font-bold">Completa tu pauta</h2>
        <p className="text-sm text-slate-300">
          La pauta guardada todavía no tiene metas o equivalencias. Carga la
          referencia o configúrala para ver tu avance. Tus comidas y nutrientes
          están conservados.
        </p>
        <button
          onClick={onConfigure}
          className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950"
        >
          Completar pauta
        </button>
      </section>
    );
  return (
    <section className="space-y-2.5 rounded-2xl border border-emerald-500/30 bg-slate-900 p-3 sm:space-y-4 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold sm:text-base">Avance de mi pauta</h2>
          <p className="mt-1 hidden text-xs text-slate-400 sm:block">
            {plan.name} · versión {plan.version} · Porciones de alimentos
          </p>
        </div>
        <button
          onClick={onConfigure}
          aria-label="Configurar pauta"
          title="Configurar pauta"
          className="-my-2 grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10 sm:my-0 sm:px-2"
        >
          <Settings2 className="size-4 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Configurar pauta</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {PAUTA_GROUPS.map((group) => {
          const target = plan.targets[group];
          const value = summary.consumed[group];
          const percent =
            target != null && target > 0 ? (value / target) * 100 : null;
          return (
            <div
              key={group}
              className={`${
                target === null || target === 0 ? 'hidden sm:block' : ''
              } min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-2 sm:rounded-xl sm:p-3`}
            >
              <h3 className="text-[10px] text-slate-400 sm:text-xs">
                {PAUTA_LABELS[group]}
              </h3>
              <p className="mt-0.5 text-sm font-bold tabular-nums sm:mt-1 sm:text-base">
                {target === null ? (
                  <>
                    <span className="sm:hidden">Libre</span>
                    <span className="hidden sm:inline">Libre / sin meta</span>
                  </>
                ) : (
                  `${formatPortions(value)} / ${formatPortions(target)}`
                )}
              </p>
              {target !== null && (
                <p
                  className={`${
                    details ? 'block' : 'hidden sm:block'
                  } mt-1 text-[10px] text-emerald-300 sm:text-xs`}
                >
                  {target === 0
                    ? 'Sin porciones previstas'
                    : value < target
                    ? `Faltan ${formatPortions(target - value)}`
                    : value === target
                    ? 'Meta alcanzada'
                    : `${formatPortions(value - target)} sobre la meta`}
                  {percent !== null ? ` · ${Math.round(percent)} %` : ''}
                </p>
              )}
              {percent !== null && (
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded bg-slate-800 sm:mt-2 sm:h-1.5"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 sm:hidden">
        {PAUTA_GROUPS.filter(
          (group) => plan.targets[group] === null || plan.targets[group] === 0
        ).map((group) => (
          <p key={group}>
            {PAUTA_LABELS[group]}{' '}
            <strong className="ml-1 font-medium text-slate-200">
              {plan.targets[group] === null
                ? 'Libre'
                : `${formatPortions(summary.consumed[group])} / 0`}
            </strong>
          </p>
        ))}
      </div>
      <button
        type="button"
        aria-expanded={details}
        aria-controls={detailId}
        onClick={() => setDetails((value) => !value)}
        className="-mb-1 flex min-h-9 w-full items-center justify-between text-[11px] text-slate-400 sm:hidden"
      >
        {details ? 'Ocultar detalle' : 'Ver detalle de porciones'}
        <ChevronDown
          className={`size-3.5 transition-transform ${
            details ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      <div id={detailId} className={details ? 'block' : 'hidden sm:block'}>
        <p className="mb-2 text-xs text-slate-400 sm:hidden">
          {plan.name} · versión {plan.version}
        </p>
        <p className="text-xs text-slate-400">
          Las porciones siguen las equivalencias de tu pauta; los gramos de
          proteína, carbohidratos y grasas se cuentan por separado.
        </p>
      </div>
      {summary.pending > 0 && (
        <p role="status" className="text-xs text-amber-300">
          <span className="sm:hidden">
            {summary.pending} alimento(s) sin clasificar; sus porciones aún no
            se suman.
          </span>
          <span className="hidden sm:inline">
            Avance parcial: {summary.pending} alimento(s) pendiente(s) de
            clasificar. Sus nutrientes están registrados, pero sus porciones aún
            no se suman.
          </span>
        </p>
      )}
    </section>
  );
}
