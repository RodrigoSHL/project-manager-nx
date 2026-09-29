import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MeasurementDetail } from './components/measurement-detail';
import { MeasurementStatCard } from './components/measurement-stat-card';
import {
  constantHistoricalLimits,
  MAX_ASSET_SERIES,
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
