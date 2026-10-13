import { describe, expect, it } from 'vitest';
import { applyMeasurementFilterSelection } from './measurement-filter-state';
import { readDashboardFilters } from './dashboard-filters';

const current = new URLSearchParams(
  'tenantId=a&siteId=north&workTypeId=visual&assetTypeId=transformer&conceptId=temp&assetIds=r1,r2&period=custom&from=2026-01-01&to=2026-02-01'
);

describe('measurement filter selection', () => {
  it('preserves selected concepts and assets when the scope is unchanged, including a date-only change', () => {
    const next = applyMeasurementFilterSelection(current, 'a', {
      ...readDashboardFilters(current),
      to: '2026-03-01',
    });
    expect(next.get('conceptId')).toBe('temp');
    expect(next.get('assetIds')).toBe('r1,r2');
    expect(next.get('to')).toBe('2026-03-01');
  });
  it('clears chosen assets on a site or type change while retaining the measurement concept', () => {
    for (const field of ['siteId', 'workTypeId', 'assetTypeId'] as const) {
      const next = applyMeasurementFilterSelection(current, 'a', {
        ...readDashboardFilters(current),
        [field]: '',
      });
      expect(next.has(field)).toBe(false);
      expect(next.has('assetIds')).toBe(false);
      expect(next.get('conceptId')).toBe('temp');
    }
  });
  it('removes all tenant-specific selections when applying a different company', () => {
    const next = applyMeasurementFilterSelection(
      current,
      'b',
      readDashboardFilters(current)
    );
    expect(next.get('tenantId')).toBe('b');
    for (const key of [
      'siteId',
      'workTypeId',
      'assetTypeId',
      'conceptId',
      'assetIds',
    ])
      expect(next.has(key)).toBe(false);
    expect(current.get('assetIds')).toBe('r1,r2');
  });
});
