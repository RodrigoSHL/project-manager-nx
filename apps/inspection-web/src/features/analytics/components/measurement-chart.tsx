import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MeasurementSeries } from '../models';
import {
  constantHistoricalLimits,
  formatMeasurementDate,
  formatMeasurementDateTime,
  formatMeasurementValue,
  measurementStatus,
  toChartRows,
  type ChartRow,
} from '../measurement-comparison';

const colors = ['#0f766e', '#1d4ed8', '#7c3aed', '#b45309', '#be185d'];

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
  assetId: string;
  color: string;
  onSelect: (responseId: string) => void;
};

function MeasurementDot({
  cx,
  cy,
  payload,
  assetId,
  color,
  onSelect,
}: DotProps) {
  const point = payload?.points[assetId];
  if (cx === undefined || cy === undefined || !point) return null;
  const common = {
    onClick: () => onSelect(point.responseId),
    className: 'cursor-pointer',
  };
  if (point.isInRange === false)
    return (
      <path
        d={`M ${cx} ${cy - 7} L ${cx + 7} ${cy + 6} L ${cx - 7} ${cy + 6} Z`}
        fill="#fff7ed"
        stroke="#c2410c"
        strokeWidth={2}
        {...common}
      />
    );
  if (point.isInRange === undefined)
    return (
      <rect
        x={cx - 5}
        y={cy - 5}
        width={10}
        height={10}
        rx={1}
        fill="white"
        stroke={color}
        strokeWidth={2}
        {...common}
      />
    );
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="white"
      strokeWidth={2}
      {...common}
    />
  );
}

function MeasurementTooltip({
  active,
  payload,
  series,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartRow }>;
  series: MeasurementSeries[];
  unit?: string | null;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const asset = series.find((item) => row.points[item.assetId]);
  const point = asset && row.points[asset.assetId];
  if (!asset || !point) return null;
  return (
    <div className="max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-950">{asset.assetName}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">
        {formatMeasurementValue(point.value, unit)}
      </p>
      <p className="mt-1 text-slate-600">
        Medido el {formatMeasurementDateTime(point)}
      </p>
      <p className="text-slate-600">
        Rango aplicado: {point.minValue ?? '—'} a {point.maxValue ?? '—'}{' '}
        {unit ?? ''}
      </p>
      <p className="font-medium text-slate-800">{measurementStatus(point)}</p>
      <p className="mt-1 text-slate-600">
        Trabajo: {point.workTitle || point.workId}
      </p>
      {point.findingTitle && (
        <p className="text-amber-800">Hallazgo: {point.findingTitle}</p>
      )}
      <p className="mt-2 text-slate-500">
        Selecciona el punto para abrir sus enlaces.
      </p>
    </div>
  );
}

export function MeasurementChart({
  series,
  unit,
  onSelect,
}: {
  series: MeasurementSeries[];
  unit?: string | null;
  onSelect: (responseId: string) => void;
}) {
  const rows = toChartRows(series);
  const limits = constantHistoricalLimits(series);
  const hasTime = series.some((asset) =>
    asset.measurements.some((point) => Boolean(point.measuredAtTime))
  );
  if (!rows.length)
    return (
      <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-600">
        Aún no existen mediciones para este concepto en el período seleccionado.
      </p>
    );
  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div
          className="h-96 min-w-[680px]"
          role="img"
          aria-label="Evolución histórica de mediciones por activo; cada símbolo es una medición real"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 20, right: 28, left: 4, bottom: 12 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value: number) => {
                  const iso = new Date(value).toISOString();
                  const date = formatMeasurementDate(iso);
                  return hasTime ? `${date} ${iso.slice(11, 16)}` : date;
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={55}
              />
              <Tooltip
                content={(props) => (
                  <MeasurementTooltip
                    active={props.active}
                    payload={
                      props.payload as ReadonlyArray<{ payload: ChartRow }>
                    }
                    series={series}
                    unit={unit}
                  />
                )}
              />
              <Legend verticalAlign="bottom" />
              {limits?.minValue !== undefined && (
                <ReferenceLine
                  y={limits.minValue}
                  ifOverflow="extendDomain"
                  stroke="#64748b"
                  strokeDasharray="5 4"
                  label={{
                    value: 'Mínimo permitido',
                    position: 'insideTopLeft',
                    fill: '#64748b',
                    fontSize: 11,
                  }}
                />
              )}
              {limits?.maxValue !== undefined && (
                <ReferenceLine
                  y={limits.maxValue}
                  ifOverflow="extendDomain"
                  stroke="#c2410c"
                  strokeDasharray="5 4"
                  label={{
                    value: 'Máximo permitido',
                    position: 'insideBottomLeft',
                    fill: '#c2410c',
                    fontSize: 11,
                  }}
                />
              )}
              {series.map((asset, index) => (
                <Line
                  key={asset.assetId}
                  dataKey={asset.assetId}
                  name={asset.assetName}
                  type="linear"
                  connectNulls
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={(props) => (
                    <MeasurementDot
                      {...props}
                      assetId={asset.assetId}
                      color={colors[index % colors.length]}
                      onSelect={onSelect}
                    />
                  )}
                  activeDot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
        <span>
          <span aria-hidden="true" className="font-bold text-teal-700">
            ●
          </span>{' '}
          En rango
        </span>
        <span>
          <span aria-hidden="true" className="font-bold text-orange-700">
            ▲
          </span>{' '}
          Fuera de rango
        </span>
        <span>
          <span aria-hidden="true" className="font-bold text-slate-700">
            ■
          </span>{' '}
          Sin rango evaluable
        </span>
      </div>
      {!limits && (
        <p className="mt-3 text-xs text-slate-500">
          Los límites cambian entre mediciones o no están configurados. Consulta
          el rango histórico de cada punto en su detalle.
        </p>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Las líneas unen únicamente observaciones reales de Works; no se crean
        mediciones intermedias. La fecha es el día de inspección; si existe una
        hora, se usa para ordenar las lecturas.
      </p>
    </>
  );
}
