import { describe, expect, it } from 'vitest';
import {
  analyticsFilters,
  changeDashboardFilters,
  presetDates,
  readDashboardFilters,
} from './dashboard-filters';

const today = new Date(2026, 8, 29, 12);

describe('dashboard filters', () => {
  it('defaults to the last six months and preserves the range in the URL', () => {
    const initial = readDashboardFilters(new URLSearchParams(), today);
    expect(initial).toMatchObject({
      period: '6m',
      from: '2026-03-29',
      to: '2026-09-29',
    });
    const next = changeDashboardFilters(
      new URLSearchParams('tenantId=tenant-1'),
      { period: '6m', from: initial.from, to: initial.to },
      today
    );
    expect(next.get('tenantId')).toBe('tenant-1');
    expect(next.get('from')).toBe('2026-03-29');
    expect(next.get('to')).toBe('2026-09-29');
  });

  it('switches site and 30-day period without losing other filters', () => {
    const current = new URLSearchParams(
      'tenantId=tenant-1&siteId=north&workTypeId=visual&period=6m&from=2026-03-29&to=2026-09-29'
    );
    const next = changeDashboardFilters(
      current,
      { siteId: 'south', period: '30d' },
      today
    );
    expect(readDashboardFilters(next, today)).toMatchObject({
      siteId: 'south',
      workTypeId: 'visual',
      period: '30d',
      from: '2026-08-31',
      to: '2026-09-29',
    });
    expect(analyticsFilters(readDashboardFilters(next, today))).toMatchObject({
      siteId: 'south',
      from: '2026-08-31',
    });
  });

  it('keeps custom dates and excludes UI-only period from API filters', () => {
    const next = changeDashboardFilters(
      new URLSearchParams('tenantId=tenant-1'),
      { period: 'custom', from: '2026-01-01', to: '2026-02-01' },
      today
    );
    expect(readDashboardFilters(next, today).period).toBe('custom');
    expect(analyticsFilters(readDashboardFilters(next, today))).toEqual({
      from: '2026-01-01',
      to: '2026-02-01',
      siteId: undefined,
      workTypeId: undefined,
      assetTypeId: undefined,
    });
    expect(presetDates('12m', today).from).toBe('2025-09-29');
  });
});
