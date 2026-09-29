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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Link
        to={`/assets/${encodeURIComponent(
          series.assetId
        )}/history?${params.toString()}`}
        className="font-semibold text-slate-950 hover:underline"
      >
        {series.assetName}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Último valor</p>
          <p className="text-2xl font-semibold text-slate-950">
            {formatMeasurementValue(stats.latest, unit)}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {formatMeasurementDate(stats.latestMeasuredAt)}
        </p>
      </div>
      <p
        className={`mt-2 text-sm font-medium ${
          stats.latestIsInRange === false
            ? 'text-orange-700'
            : stats.latestIsInRange === true
            ? 'text-emerald-700'
            : 'text-slate-600'
        }`}
      >
        {stats.latestIsInRange === false
          ? '▲'
          : stats.latestIsInRange === true
          ? '●'
          : '■'}{' '}
        {status}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Mínimo observado</dt>
          <dd className="font-medium text-slate-900">
            {formatMeasurementValue(stats.min, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Máximo observado</dt>
          <dd className="font-medium text-slate-900">
            {formatMeasurementValue(stats.max, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Promedio observado</dt>
          <dd className="font-medium text-slate-900">
            {formatMeasurementValue(stats.avg, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Mediciones</dt>
          <dd className="font-medium text-slate-900">
            {stats.count.toLocaleString('es-CL')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Porcentaje en rango</dt>
          <dd className="font-medium text-slate-900">
            {stats.evaluable
              ? `${Math.round(stats.percentageInRange ?? 0)} %`
              : 'Sin rango configurado'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Evaluables</dt>
          <dd className="font-medium text-slate-900">
            {stats.evaluable.toLocaleString('es-CL')}
          </dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Rango permitido en la última medición: {stats.latestMinValue ?? '—'} a{' '}
        {stats.latestMaxValue ?? '—'} {unit ?? ''}. Los límites pueden variar
        entre Works.
      </p>
    </article>
  );
}
