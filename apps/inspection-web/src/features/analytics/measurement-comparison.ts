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

export function measurementAxisTicks(
  rows: ChartRow[],
  hasTime: boolean
): number[] {
  if (!rows.length) return [];
  const first = rows[0].timestamp;
  const last = rows[rows.length - 1].timestamp;
  const precision = hasTime ? 60_000 : 86_400_000;
  const count = Math.min(5, Math.floor((last - first) / precision) + 1);
  if (count <= 1) return [first];
  return Array.from(
    { length: count },
    (_, index) => first + ((last - first) * index) / (count - 1)
  );
}

export function historicalLineSegments(
  rows: ChartRow[],
  series: MeasurementSeries[]
): {
  rows: ChartRow[];
  segments: { key: string; assetId: string }[];
  hasAmbiguousDays: boolean;
} {
  const chartRows = rows.map((row) => ({ ...row }));
  const byKey = new Map(chartRows.map((row) => [row.key, row]));
  const segments: { key: string; assetId: string }[] = [];
  let hasAmbiguousDays = false;

  for (const asset of series) {
    const assetRows = rows.filter((row) => row.points[asset.assetId]);
    const byDay = new Map<string, ChartRow[]>();
    for (const row of assetRows) {
      const day = row.points[asset.assetId].measuredAt.slice(0, 10);
      byDay.set(day, [...(byDay.get(day) ?? []), row]);
    }
    const ambiguousDays = new Set(
      [...byDay]
        .filter(([, dayRows]) => {
          if (dayRows.length < 2) return false;
          const times = dayRows.map((row) =>
            row.points[asset.assetId].measuredAtTime?.slice(0, 5)
          );
          return (
            times.some((time) => !time) || new Set(times).size < times.length
          );
        })
        .map(([day]) => day)
    );
    hasAmbiguousDays ||= ambiguousDays.size > 0;

    let group: ChartRow[] = [];
    const addGroup = () => {
      if (group.length < 2) return;
      const key = `historical-line:${asset.assetId}:${segments.length}`;
      for (const row of group) {
        const chartRow = byKey.get(row.key);
        if (chartRow) chartRow[key] = row.points[asset.assetId].value;
      }
      segments.push({ key, assetId: asset.assetId });
    };
    for (const row of assetRows) {
      const day = row.points[asset.assetId].measuredAt.slice(0, 10);
      if (ambiguousDays.has(day)) {
        addGroup();
        group = [];
      } else {
        group.push(row);
      }
    }
    addGroup();
  }

  return { rows: chartRows, segments, hasAmbiguousDays };
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
