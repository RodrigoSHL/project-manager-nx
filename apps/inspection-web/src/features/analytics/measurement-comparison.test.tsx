import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MeasurementDetail } from './components/measurement-detail';
import { MeasurementStatCard } from './components/measurement-stat-card';
import {
  constantHistoricalLimits,
  formatMeasurementDateTime,
  historicalLineSegments,
  MAX_ASSET_SERIES,
  measurementAxisTicks,
  measurementStatus,
  parseAssetIds,
  toChartRows,
  toggleAssetId,
} from './measurement-comparison';
import type { MeasurementPoint, MeasurementSeries } from './models';

const point = (
  id: string,
  measuredAt: string,
  value: number,
  maxValue: number,
  isInRange: boolean
): MeasurementPoint => ({
  responseId: id,
  workItemId: `item-${id}`,
  workId: `work-${id}`,
  workTitle: `Inspección ${id}`,
  hasReport: false,
  workDate: measuredAt,
  measuredAt,
  value,
  minValue: 0,
  maxValue,
  isInRange,
});

function series(
  assetId: string,
  name: string,
  measurements: MeasurementPoint[]
): MeasurementSeries {
  return {
    assetId,
    assetName: name,
    measurements,
    statistics: {
      count: measurements.length,
      min: Math.min(...measurements.map((item) => item.value)),
      max: Math.max(...measurements.map((item) => item.value)),
      avg: 75,
      latest: measurements.at(-1)?.value ?? 0,
      latestMeasuredAt: measurements.at(-1)?.measuredAt,
      inRange: 1,
      evaluable: measurements.length,
      percentageInRange: 50,
    },
  };
}

describe('historical measurement comparison', () => {
  it('keeps irregular Work observations in separate child-asset series without inventing dates', () => {
    const r1 = series('radiator-r1', 'Radiador R1', [
      point('jan-r1', '2026-01-12', 65, 80, true),
      point('sep-r1', '2026-09-12', 84, 80, false),
    ]);
    const r2 = series('radiator-r2', 'Radiador R2', [
      point('mar-r2', '2026-03-12', 65, 80, true),
      point('sep-r2', '2026-09-13', 74, 80, true),
    ]);
    const rows = toChartRows([r1, r2]);
    expect(rows).toHaveLength(4);
    expect(
      rows.map((row) => new Date(row.timestamp).toISOString().slice(0, 10))
    ).toEqual(['2026-01-12', '2026-03-12', '2026-09-12', '2026-09-13']);
    expect(rows[2].points['radiator-r1'].value).toBe(84);
    expect(rows[2].points['radiator-r2']).toBeUndefined();
    expect(measurementStatus(r1.measurements[1])).toBe('Fuera de rango');
    expect(measurementStatus(r2.measurements[1])).toBe('En rango');
    expect(constantHistoricalLimits([r1, r2])).toEqual({
      minValue: 0,
      maxValue: 80,
    });
  });

  it('does not draw one misleading limit when Work snapshots differ', () => {
    const history = series('radiator-r1', 'Radiador R1', [
      point('a', '2026-09-01', 85, 80, false),
      point('b', '2026-09-02', 85, 90, true),
    ]);
    expect(constantHistoricalLimits([history])).toBeNull();
    expect(history.measurements.map(measurementStatus)).toEqual([
      'Fuera de rango',
      'En rango',
    ]);
  });

  it('orders same-day readings by recorded time while preserving date-only readings', () => {
    const readings = series('fan-1', 'Ventilador 1', [
      {
        ...point('afternoon', '2026-09-29', 60, 42, false),
        measuredAtTime: '15:00',
      },
      {
        ...point('morning', '2026-09-29', 44, 42, false),
        measuredAtTime: '09:00',
      },
      point('legacy', '2026-09-28', 1, 42, false),
    ]);
    const rows = toChartRows([readings]);

    expect(rows.map((row) => row.key)).toEqual([
      'legacy',
      'morning',
      'afternoon',
    ]);
    expect(rows[2].timestamp - rows[1].timestamp).toBe(6 * 60 * 60 * 1000);
    expect(formatMeasurementDateTime(readings.measurements[0])).toBe(
      '29/09/2026, 15:00'
    );
    expect(formatMeasurementDateTime(readings.measurements[2])).toBe(
      '28/09/2026'
    );
  });

  it('spaces axis dates evenly and avoids duplicate day labels in a short date-only range', () => {
    const readings = series('fan-1', 'Ventilador 1', [
      point('first', '2026-09-28', 12, 42, true),
      point('last', '2026-09-29', 20, 42, true),
    ]);
    const ticks = measurementAxisTicks(toChartRows([readings]), false);
    expect(ticks).toEqual([
      Date.parse('2026-09-28T00:00:00Z'),
      Date.parse('2026-09-29T00:00:00Z'),
    ]);

    const longRange = series('fan-1', 'Ventilador 1', [
      point('first', '2026-09-02', 12, 42, true),
      point('last', '2026-09-29', 20, 42, true),
    ]);
    const regularTicks = measurementAxisTicks(toChartRows([longRange]), false);
    expect(regularTicks).toHaveLength(5);
    expect(regularTicks[1] - regularTicks[0]).toBe(
      regularTicks[2] - regularTicks[1]
    );
  });

  it('keeps legacy same-day readings visible without drawing an invented sequence', () => {
    const readings = series('fan-1', 'Ventilador 1', [
      point('previous', '2026-09-28', 30, 42, true),
      point('same-day-a', '2026-09-29', 44, 42, false),
      point('same-day-b', '2026-09-29', 60, 42, false),
      point('next', '2026-09-30', 32, 42, true),
      point('later', '2026-10-01', 33, 42, true),
    ]);
    const chart = historicalLineSegments(toChartRows([readings]), [readings]);

    expect(chart.hasAmbiguousDays).toBe(true);
    expect(chart.rows).toHaveLength(5);
    expect(chart.segments).toHaveLength(1);
    const line = chart.segments[0].key;
    expect(
      chart.rows.filter((row) => row[line] !== undefined).map((row) => row.key)
    ).toEqual(['next', 'later']);
  });

  it('connects same-day readings when distinct hours establish their order', () => {
    const readings = series('fan-1', 'Ventilador 1', [
      {
        ...point('early', '2026-09-29', 44, 42, false),
        measuredAtTime: '01:22',
      },
      {
        ...point('late', '2026-09-29', 60, 42, false),
        measuredAtTime: '11:03',
      },
    ]);
    const chart = historicalLineSegments(toChartRows([readings]), [readings]);

    expect(chart.hasAmbiguousDays).toBe(false);
    expect(chart.segments).toHaveLength(1);
    expect(chart.rows.map((row) => row[chart.segments[0].key])).toEqual([
      44, 60,
    ]);
  });

  it('deduplicates URL assets and enforces the five-series limit', () => {
    expect(parseAssetIds('r1,r1,r2')).toEqual(['r1', 'r2']);
    expect(toggleAssetId(['r1', 'r2', 'r3', 'r4', 'r5'], 'r6')).toHaveLength(
      MAX_ASSET_SERIES
    );
    expect(toggleAssetId(['r1', 'r2'], 'r1')).toEqual(['r2']);
  });

  it('links a real finding to its Work and shows a report only when one exists', () => {
    const asset = series('radiator-r1', 'Radiador R1', []);
    const withFinding = {
      ...point('a', '2026-09-01', 85, 80, false),
      findingId: 'finding-a',
      findingTitle: 'Temperatura elevada',
    };
    const withoutReport = renderToStaticMarkup(
      <MemoryRouter>
        <MeasurementDetail
          asset={asset}
          point={withFinding}
          tenantId="tenant-1"
          unit="°C"
        />
      </MemoryRouter>
    );
    expect(withoutReport).toContain('Ver trabajo');
    expect(withoutReport).toContain('Ver hallazgo');
    expect(withoutReport).toContain('#finding-finding-a');
    expect(withoutReport).not.toContain('Ver informe');
    const withReport = renderToStaticMarkup(
      <MemoryRouter>
        <MeasurementDetail
          asset={asset}
          point={{ ...withFinding, hasReport: true }}
          tenantId="tenant-1"
          unit="°C"
        />
      </MemoryRouter>
    );
    expect(withReport).toContain('Ver informe');
  });

  it('shows observed values separately from permitted limits and avoids false zero percent', () => {
    const asset = series('radiator-r1', 'Radiador R1', [
      point('a', '2026-09-01', 85, 80, false),
    ]);
    asset.statistics.evaluable = 0;
    asset.statistics.percentageInRange = undefined;
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MeasurementStatCard
          series={asset}
          tenantId="tenant-1"
          unit="°C"
          search=""
        />
      </MemoryRouter>
    );
    expect(html).toContain('Máximo observado');
    expect(html).toContain('Rango permitido en la última medición');
    expect(html).toContain('Sin rango configurado');
    expect(html).not.toContain('0 %');
  });
});
