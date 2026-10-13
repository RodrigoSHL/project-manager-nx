import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import type { AnalyticsMeasurements } from '../models';
import {
  formatMeasurementDate,
  formatMeasurementValue,
} from '../measurement-comparison';
import {
  ambiguousVariableDays,
  variableRows,
  variableSegments,
  type VariableRow,
} from '../variable-comparison';

const colors = { first: 'var(--chart-series-1)', second: 'var(--chart-series-4)' };

function PointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: VariableRow }>;
}) {
  if (!active || !payload?.length) return null;
  const { point } = payload[0].payload;
  return (
    <div className="max-w-72 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-950 dark:text-slate-100">
        {point.assetName} · {point.conceptName}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
        {formatMeasurementValue(point.value, point.unit)}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        {formatMeasurementDate(point.measuredAt)} ·{' '}
        {point.measuredAtTime?.slice(0, 5) ?? 'hora no registrada'}
      </p>
      <p className="mt-1 text-slate-600 dark:text-slate-300">{point.workTitle}</p>
    </div>
  );
}

export function VariableComparisonChart({
  first,
  second,
  tenantId,
}: {
  first: AnalyticsMeasurements;
  second: AnalyticsMeasurements;
  tenantId: string;
}) {
  const rows = variableRows(first, second);
  if (!rows.length)
    return (
      <p className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-600 dark:text-slate-300">
        No hay mediciones para las variables elegidas en este período.
      </p>
    );
  const firstLabel = `${first.series[0]?.assetName ?? 'Activo'} · ${
    first.concept.name
  }`;
  const secondLabel = `${second.series[0]?.assetName ?? 'Activo'} · ${
    second.concept.name
  }`;
  const segments = variableSegments(rows);
  const ambiguousDays = ambiguousVariableDays(rows);
  const dateOnlyCount = rows.filter((row) => !row.point.measuredAtTime).length;
  const hasTime = dateOnlyCount < rows.length;
  return (
    <section className="min-w-0 break-words rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
        Curvas históricas
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Mediciones registradas de ambas variables. Cada eje tiene su propia
        escala.
      </p>
      <div className="mt-4 min-w-0">
        <div
          className="h-72 w-full min-w-0 md:h-96"
          role="img"
          aria-label="Comparación de dos conceptos sobre la misma línea de tiempo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 20, right: 30, left: 10, bottom: 15 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value: number) => {
                  const iso = new Date(value).toISOString();
                  const date = formatMeasurementDate(iso).slice(0, 5);
                  return hasTime ? `${date} ${iso.slice(11, 16)}` : date;
                }}
                tick={{ fontSize: 11, fill: 'var(--chart-text)' }}
              />
              <YAxis
                yAxisId="first"
                type="number"
                domain={['auto', 'auto']}
                stroke={colors.first}
                width={50}
                unit={first.concept.unit ?? undefined}
              />
              <YAxis
                yAxisId="second"
                orientation="right"
                type="number"
                domain={['auto', 'auto']}
                stroke={colors.second}
                width={50}
                unit={second.concept.unit ?? undefined}
              />
              <Tooltip
                content={(props) => (
                  <PointTooltip
                    active={props.active}
                    payload={
                      props.payload as ReadonlyArray<{ payload: VariableRow }>
                    }
                  />
                )}
              />
              {segments.map((segment, index) => (
                <ReferenceLine
                  key={`${segment.side}-${index}`}
                  yAxisId={segment.side}
                  segment={[segment.from, segment.to]}
                  stroke={colors[segment.side]}
                  strokeWidth={2}
                />
              ))}
              <Line
                yAxisId="first"
                dataKey="first"
                name={firstLabel}
                stroke="transparent"
                strokeWidth={2}
                dot={{ r: 4, fill: colors.first, stroke: colors.first }}
                activeDot={{ r: 7, fill: colors.first, stroke: colors.first }}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                yAxisId="second"
                dataKey="second"
                name={secondLabel}
                stroke="transparent"
                strokeWidth={2}
                dot={{ r: 4, fill: colors.second, stroke: colors.second }}
                activeDot={{ r: 7, fill: colors.second, stroke: colors.second }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-700 dark:text-slate-200">
        <span className="flex items-center gap-2">
          <span
            className="h-0.5 w-5"
            style={{ backgroundColor: colors.first }}
            aria-hidden="true"
          />
          {firstLabel}
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-0.5 w-5"
            style={{ backgroundColor: colors.second }}
            aria-hidden="true"
          />
          {secondLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        <p>
          Eje izquierdo: {firstLabel} ({first.concept.unit || 'sin unidad'}).
          Eje derecho: {secondLabel} ({second.concept.unit || 'sin unidad'}).
          Las escalas son independientes.
        </p>
        <p>
          {dateOnlyCount} de {rows.length} mediciones sin hora. Se ubican al
          inicio del día solo para el gráfico; no permiten medir un desfase
          horario.
        </p>
      </div>
      {ambiguousDays > 0 && (
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
          Hay varias lecturas del mismo día sin hora; sus puntos no se unen
          porque no sabemos su orden.
        </p>
      )}
      <div className="mt-5 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Mediciones incluidas
        </h3>
        <div className="max-h-72 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {row.point.assetName} · {row.point.conceptName}
                </span>
                <span className="ml-2 text-slate-500 dark:text-slate-400">
                  {formatMeasurementDate(row.point.measuredAt)}{' '}
                  {row.point.measuredAtTime?.slice(0, 5) ?? 'sin hora'}
                </span>
                <span className="ml-2 text-slate-800 dark:text-slate-200">
                  {formatMeasurementValue(row.point.value, row.point.unit)}
                </span>
              </span>
              <Link
                to={`/works/${encodeURIComponent(
                  row.point.workId
                )}?tenantId=${encodeURIComponent(tenantId)}`}
                className="inline-flex min-h-11 items-center font-medium text-blue-700 dark:text-blue-300 hover:underline"
              >
                Ver trabajo
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
