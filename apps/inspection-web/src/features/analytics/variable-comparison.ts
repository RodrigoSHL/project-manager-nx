import type { AnalyticsMeasurements, MeasurementPoint } from './models';

export const MAX_VARIABLE_POINTS = 1500;

export type VariablePoint = MeasurementPoint & {
  assetName: string;
  conceptName: string;
  unit?: string | null;
};

export type VariableRow = {
  key: string;
  timestamp: number;
  first?: number;
  second?: number;
  point: VariablePoint;
  side: 'first' | 'second';
};

export type VariableSegment = {
  side: VariableRow['side'];
  from: { x: number; y: number };
  to: { x: number; y: number };
};

// A missing clock time has day precision only. Midnight is just a chart bucket,
// never an inferred measurement hour.
export function measurementTimestamp(point: MeasurementPoint): number {
  const time = point.measuredAtTime?.slice(0, 5) ?? '00:00';
  return Date.parse(`${point.measuredAt.slice(0, 10)}T${time}:00Z`);
}

export function variableRows(
  first: AnalyticsMeasurements,
  second: AnalyticsMeasurements
): VariableRow[] {
  return (
    [
      ...first.series.flatMap((asset) =>
        asset.measurements.map((point) => ({
          key: `first:${point.responseId}`,
          timestamp: measurementTimestamp(point),
          first: point.value,
          point: {
            ...point,
            assetName: asset.assetName,
            conceptName: first.concept.name,
            unit: first.concept.unit,
          },
          side: 'first' as const,
        }))
      ),
      ...second.series.flatMap((asset) =>
        asset.measurements.map((point) => ({
          key: `second:${point.responseId}`,
          timestamp: measurementTimestamp(point),
          second: point.value,
          point: {
            ...point,
            assetName: asset.assetName,
            conceptName: second.concept.name,
            unit: second.concept.unit,
          },
          side: 'second' as const,
        }))
      ),
    ] as VariableRow[]
  ).sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}

export function ambiguousVariableDays(rows: VariableRow[]): number {
  const days = new Set<string>();
  for (const side of ['first', 'second'] as const) {
    const grouped = new Map<string, VariableRow[]>();
    for (const row of rows.filter((item) => item.side === side)) {
      const day = row.point.measuredAt.slice(0, 10);
      grouped.set(day, [...(grouped.get(day) ?? []), row]);
    }
    for (const [day, readings] of grouped) {
      if (
        readings.length > 1 &&
        readings.some((row) => !row.point.measuredAtTime)
      )
        days.add(day);
    }
  }
  return days.size;
}

// This chart does not impose an order on multiple readings that have only a day.
export function variableSegments(rows: VariableRow[]): VariableSegment[] {
  return (['first', 'second'] as const).flatMap((side) => {
    const readings = rows.filter((row) => row.side === side);
    const countsByTime = new Map<number, number>();
    const readingsByDay = new Map<string, VariableRow[]>();
    for (const row of readings) {
      countsByTime.set(
        row.timestamp,
        (countsByTime.get(row.timestamp) ?? 0) + 1
      );
      const day = row.point.measuredAt.slice(0, 10);
      readingsByDay.set(day, [...(readingsByDay.get(day) ?? []), row]);
    }
    const ambiguous = (row: VariableRow) => {
      const sameDay =
        readingsByDay.get(row.point.measuredAt.slice(0, 10)) ?? [];
      return (
        (countsByTime.get(row.timestamp) ?? 0) > 1 ||
        (sameDay.length > 1 &&
          sameDay.some((item) => !item.point.measuredAtTime))
      );
    };
    return readings.slice(1).flatMap((row, index) => {
      const previous = readings[index];
      if (
        row.timestamp <= previous.timestamp ||
        ambiguous(previous) ||
        ambiguous(row)
      )
        return [];
      return [
        {
          side,
          from: { x: previous.timestamp, y: previous.point.value },
          to: { x: row.timestamp, y: row.point.value },
        },
      ];
    });
  });
}
