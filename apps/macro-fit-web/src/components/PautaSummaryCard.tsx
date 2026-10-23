import {
  NutritionPlan,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  formatPortions,
  summarizePauta,
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
  return (
    <section className="space-y-4 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Avance de mi pauta</h2>
          <p className="mt-1 text-xs text-slate-400">
            {plan.name} · versión {plan.version} · Porciones de alimentos
          </p>
        </div>
        <button
          onClick={onConfigure}
          className="text-xs font-semibold text-emerald-300"
        >
          Configurar pauta
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PAUTA_GROUPS.map((group) => {
          const target = plan.targets[group];
          const value = summary.consumed[group];
          const percent =
            target != null && target > 0 ? (value / target) * 100 : null;
          return (
            <div
              key={group}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <h3 className="text-xs text-slate-400">{PAUTA_LABELS[group]}</h3>
              <p className="mt-1 font-bold">
                {target === null
                  ? 'Libre / sin meta'
                  : `${formatPortions(value)} / ${formatPortions(target)}`}
              </p>
              {target !== null && (
                <p className="mt-1 text-xs text-emerald-300">
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
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-800">
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
      <p className="text-xs text-slate-400">
        Las porciones siguen las equivalencias de tu pauta; los gramos de
        proteína, carbohidratos y grasas se cuentan por separado.
      </p>
      {summary.pending > 0 && (
        <p role="status" className="text-xs text-amber-300">
          Avance parcial: {summary.pending} alimento(s) pendiente(s) de
          clasificar. Sus nutrientes están registrados, pero sus porciones aún
          no se suman.
        </p>
      )}
    </section>
  );
}
