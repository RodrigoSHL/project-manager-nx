import type { AnalyticsSummary } from '../models';

export function MeasurementsStatusCard({
  summary,
}: {
  summary: AnalyticsSummary;
}) {
  const rows = [
    { label: 'En rango', value: summary.measurementsInRange },
    { label: 'Fuera de rango', value: summary.measurementsOutOfRange },
  ];
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
        >
          <span className="text-slate-600">{row.label}</span>
          <strong className="text-slate-950">
            {row.value.toLocaleString('es-CL')}
          </strong>
        </div>
      ))}
      <p className="pt-2 text-xs text-slate-500">
        Base: {summary.measurementsEvaluable.toLocaleString('es-CL')} mediciones
        evaluables. Las mediciones sin límites configurados no entran en este
        cálculo.
      </p>
    </div>
  );
}
