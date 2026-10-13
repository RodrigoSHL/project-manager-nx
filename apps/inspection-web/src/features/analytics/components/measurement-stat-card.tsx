import { Link } from 'react-router-dom';
import type { MeasurementSeries } from '../models';
import {
  formatMeasurementDate,
  formatMeasurementValue,
  measurementStatus,
} from '../measurement-comparison';

export function MeasurementStatCard({
  series,
  unit,
  tenantId,
  search,
}: {
  series: MeasurementSeries;
  unit?: string | null;
  tenantId: string;
  search: string;
}) {
  const stats = series.statistics;
  const status = measurementStatus({ isInRange: stats.latestIsInRange });
  const params = new URLSearchParams(search);
  params.set('tenantId', tenantId);
  params.set('returnTo', 'measurements');
  return (
    <article className="min-w-0 break-words rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:p-5">
      <Link
        to={`/assets/${encodeURIComponent(
          series.assetId
        )}/history?${params.toString()}`}
        className="font-semibold text-slate-950 dark:text-slate-100 hover:underline"
      >
        {series.assetName}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Último valor</p>
          <p className="text-2xl font-semibold text-slate-950 dark:text-slate-100">
            {formatMeasurementValue(stats.latest, unit)}
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMeasurementDate(stats.latestMeasuredAt)}
        </p>
      </div>
      <p
        className={`mt-2 text-sm font-medium ${
          stats.latestIsInRange === false
            ? 'text-orange-700 dark:text-orange-300'
            : stats.latestIsInRange === true
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {stats.latestIsInRange === false
          ? '▲'
          : stats.latestIsInRange === true
          ? '●'
          : '■'}{' '}
        {status}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Mínimo observado</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {formatMeasurementValue(stats.min, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Máximo observado</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {formatMeasurementValue(stats.max, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Promedio observado</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {formatMeasurementValue(stats.avg, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Mediciones</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {stats.count.toLocaleString('es-CL')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Porcentaje en rango</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {stats.evaluable
              ? `${Math.round(stats.percentageInRange ?? 0)} %`
              : 'Sin rango configurado'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Evaluables</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {stats.evaluable.toLocaleString('es-CL')}
          </dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
        Rango permitido en la última medición: {stats.latestMinValue ?? '—'} a{' '}
        {stats.latestMaxValue ?? '—'} {unit ?? ''}. Los límites pueden variar
        entre trabajos.
      </p>
    </article>
  );
}
