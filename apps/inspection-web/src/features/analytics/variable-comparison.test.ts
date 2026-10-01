import { describe, expect, it } from 'vitest';
import type { AnalyticsMeasurements, MeasurementPoint } from './models';
import {
  ambiguousVariableDays,
  measurementTimestamp,
  variableRows,
  variableSegments,
} from './variable-comparison';

function measurement(
  responseId: string,
  measuredAt: string,
  value: number,
  measuredAtTime?: string
): MeasurementPoint {
  return {
    responseId,
    workItemId: `item-${responseId}`,
    workId: `work-${responseId}`,
    workTitle: `Trabajo ${responseId}`,
    hasReport: false,
    workDate: measuredAt,
    measuredAt,
    measuredAtTime,
    value,
  };
}

function result(
  conceptId: string,
  assetId: string,
  points: MeasurementPoint[]
): AnalyticsMeasurements {
  return {
    concept: {
      id: conceptId,
      name: conceptId,
      type: 'ANALOG',
      unit: conceptId === 'RPM' ? 'rpm' : '°C',
    },
    totalMeasurements: points.length,
    page: 1,
    pageSize: 1500,
    series: [
      {
        assetId,
        assetName: assetId,
        measurements: points,
        statistics: {
          count: points.length,
          min: 0,
          max: 0,
          avg: 0,
          latest: 0,
          inRange: 0,
          evaluable: 0,
        },
      },
    ],
  };
}

describe('comparison timeline', () => {
  it('orders different concepts by measured date and optional local clock without merging readings', () => {
    const rows = variableRows(
      result('RPM', 'Ventilador', [
        measurement('fan', '2026-09-23', 900, '14:10'),
      ]),
      result('Temperatura', 'Motor', [
        measurement('motor', '2026-09-23', 85, '14:35'),
      ])
    );
    expect(rows.map((row) => row.key)).toEqual(['first:fan', 'second:motor']);
    expect(rows.map((row) => [row.first, row.second])).toEqual([
      [900, undefined],
      [undefined, 85],
    ]);
    expect(rows[1].timestamp - rows[0].timestamp).toBe(25 * 60 * 1000);
  });

  it('retains date-only precision for historical readings', () => {
    const point = measurement('old', '2026-09-23', 72);
    expect(point.measuredAtTime).toBeUndefined();
    expect(measurementTimestamp(point)).toBe(
      Date.parse('2026-09-23T00:00:00Z')
    );
  });

  it('does not join readings whose order is unknown within a day', () => {
    const rows = variableRows(
      result('RPM', 'Ventilador', [
        measurement('first', '2026-09-23', 900),
        measurement('second', '2026-09-23', 850),
      ]),
      result('Temperatura', 'Motor', [])
    );

    expect(ambiguousVariableDays(rows)).toBe(1);
    expect(variableSegments(rows)).toEqual([]);
  });

  it('joins same-day readings when both have distinct recorded times', () => {
    const rows = variableRows(
      result('RPM', 'Ventilador', [
        measurement('first', '2026-09-23', 900, '10:00'),
        measurement('second', '2026-09-23', 850, '11:00'),
      ]),
      result('Temperatura', 'Motor', [])
    );

    expect(ambiguousVariableDays(rows)).toBe(0);
    expect(variableSegments(rows)).toEqual([
      {
        side: 'first',
        from: { x: Date.parse('2026-09-23T10:00:00Z'), y: 900 },
        to: { x: Date.parse('2026-09-23T11:00:00Z'), y: 850 },
      },
    ]);
  });
});
