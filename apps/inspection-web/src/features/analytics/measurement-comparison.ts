import type { MeasurementPoint, MeasurementSeries } from './models';

export const MAX_ASSET_SERIES = 5;
export const MAX_CHART_POINTS = 800;

export type ChartRow = {
  key: string;
  timestamp: number;
  points: Record<string, MeasurementPoint>;
  [assetId: string]:
    | string
    | number
    | Record<string, MeasurementPoint>
    | undefined;
};

export function parseAssetIds(value: string | null): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_ASSET_SERIES);
}

export function toggleAssetId(ids: string[], assetId: string): string[] {
  if (ids.includes(assetId)) return ids.filter((id) => id !== assetId);
  return ids.length < MAX_ASSET_SERIES ? [...ids, assetId] : ids;
}

export function measurementStatus(
  point: Pick<MeasurementPoint, 'isInRange'>
): 'En rango' | 'Fuera de rango' | 'Sin rango evaluable' {
  return point.isInRange === true
    ? 'En rango'
    : point.isInRange === false
    ? 'Fuera de rango'
    : 'Sin rango evaluable';
}

export function formatMeasurementDate(value?: string): string {
  if (!value) return '—';
  const day = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export function formatMeasurementDateTime(
  point: Pick<MeasurementPoint, 'measuredAt' | 'measuredAtTime'>
): string {
  const date = formatMeasurementDate(point.measuredAt);
  return point.measuredAtTime
    ? `${date}, ${point.measuredAtTime.slice(0, 5)}`
    : date;
}

export function formatMeasurementValue(
  value: number,
  unit?: string | null
): string {
  return `${value.toLocaleString('es-CL', { maximumFractionDigits: 2 })}${
    unit ? ` ${unit}` : ''
  }`;
}

export function toChartRows(series: MeasurementSeries[]): ChartRow[] {
  return series
    .flatMap((asset) =>
      asset.measurements.map((point) => ({
        key: point.responseId,
        timestamp: Date.parse(
          `${point.measuredAt.slice(0, 10)}T${
            point.measuredAtTime?.slice(0, 5) ?? '00:00'
          }:00Z`
        ),
        points: { [asset.assetId]: point },
        [asset.assetId]: point.value,
      }))
    )
    .sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}

export function constantHistoricalLimits(
  series: MeasurementSeries[]
): { minValue?: number; maxValue?: number } | null {
  const points = series.flatMap((asset) => asset.measurements);
  if (!points.length) return null;
  const first = points[0];
  if (first.minValue === undefined && first.maxValue === undefined) return null;
  return points.every(
    (point) =>
      point.minValue === first.minValue && point.maxValue === first.maxValue
  )
    ? { minValue: first.minValue, maxValue: first.maxValue }
    : null;
}
