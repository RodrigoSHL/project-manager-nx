import { Link } from 'react-router-dom';
import type { MeasurementPoint, MeasurementSeries } from '../models';
import {
  formatMeasurementDateTime,
  formatMeasurementValue,
  measurementStatus,
} from '../measurement-comparison';

export function MeasurementDetail({
  asset,
  point,
  tenantId,
  unit,
}: {
  asset: MeasurementSeries;
  point: MeasurementPoint;
  tenantId: string;
  unit?: string | null;
}) {
  const workPath = `/works/${encodeURIComponent(
    point.workId
  )}?tenantId=${encodeURIComponent(tenantId)}`;
  return (
    <section
      className="min-w-0 break-words rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:p-5"
      aria-label="Detalle de la medición seleccionada"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Medición seleccionada
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
        {asset.assetName}
      </h2>
      <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">
        {formatMeasurementValue(point.value, unit)}
      </p>
      <p
        className={`mt-2 text-sm font-medium ${
          point.isInRange === false
            ? 'text-orange-700 dark:text-orange-300'
            : point.isInRange === true
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {point.isInRange === false ? '▲' : point.isInRange === true ? '●' : '■'}{' '}
        {measurementStatus(point)}
      </p>
      <dl className="mt-4 grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Fecha de medición</dt>
          <dd>{formatMeasurementDateTime(point)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            Rango aplicado en este trabajo
          </dt>
          <dd>
            {point.minValue ?? '—'} a {point.maxValue ?? '—'} {unit ?? ''}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Trabajo</dt>
          <dd>{point.workTitle || point.workId}</dd>
        </div>
        {point.findingId && (
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Hallazgo confirmado</dt>
            <dd>{point.findingTitle || point.findingId}</dd>
          </div>
        )}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
        <Link
          to={workPath}
          className="rounded-lg bg-slate-950 dark:bg-slate-100 px-3 py-2 font-medium text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-300"
        >
          Ver trabajo
        </Link>
        {point.findingId && (
          <Link
            to={`${workPath}#finding-${encodeURIComponent(point.findingId)}`}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
          >
            Ver hallazgo
          </Link>
        )}
        {point.hasReport && (
          <Link
            to={`/works/${encodeURIComponent(
              point.workId
            )}/report?tenantId=${encodeURIComponent(tenantId)}`}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
          >
            Ver informe
          </Link>
        )}
      </div>
    </section>
  );
}
