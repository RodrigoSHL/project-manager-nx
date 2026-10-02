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
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-label="Detalle de la medición seleccionada"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Medición seleccionada
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-950">
        {asset.assetName}
      </h2>
      <p className="mt-2 text-3xl font-semibold text-slate-950">
        {formatMeasurementValue(point.value, unit)}
      </p>
      <p
        className={`mt-2 text-sm font-medium ${
          point.isInRange === false
            ? 'text-orange-700'
            : point.isInRange === true
            ? 'text-emerald-700'
            : 'text-slate-600'
        }`}
      >
        {point.isInRange === false ? '▲' : point.isInRange === true ? '●' : '■'}{' '}
        {measurementStatus(point)}
      </p>
      <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Fecha de medición</dt>
          <dd>{formatMeasurementDateTime(point)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">
            Rango aplicado en este Work
          </dt>
          <dd>
            {point.minValue ?? '—'} a {point.maxValue ?? '—'} {unit ?? ''}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Trabajo</dt>
          <dd>{point.workTitle || point.workId}</dd>
        </div>
        {point.findingId && (
          <div>
            <dt className="text-xs text-slate-500">Hallazgo confirmado</dt>
            <dd>{point.findingTitle || point.findingId}</dd>
          </div>
        )}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-sm">
        <Link
          to={workPath}
          className="rounded-lg bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800"
        >
          Ver trabajo
        </Link>
        {point.findingId && (
          <Link
            to={`${workPath}#finding-${encodeURIComponent(point.findingId)}`}
            className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
          >
            Ver hallazgo
          </Link>
        )}
        {point.hasReport && (
          <Link
            to={`/works/${encodeURIComponent(
              point.workId
            )}/report?tenantId=${encodeURIComponent(tenantId)}`}
            className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
          >
            Ver informe
          </Link>
        )}
      </div>
    </section>
  );
}
