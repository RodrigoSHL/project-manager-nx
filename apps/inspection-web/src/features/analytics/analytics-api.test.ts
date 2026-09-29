import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch } from '../auth/authenticated-fetch';
import { analyticsApi } from './analytics-api';
import type { AnalyticsFilters } from './models';

vi.mock('../auth/authenticated-fetch', () => ({ authenticatedFetch: vi.fn() }));

const fetchMock = vi.mocked(authenticatedFetch);
const filters: AnalyticsFilters = {
  from: '2026-03-01',
  to: '2026-09-01',
};

describe('analytics API requests', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  it('uses the selected tenant and the same filters across dashboard endpoints', async () => {
    const selected = {
      ...filters,
      siteId: 'site-north',
      workTypeId: 'visual',
      assetTypeId: 'transformer',
    };

    await Promise.all([
      analyticsApi.summary('tenant-a', selected),
      analyticsApi.findings('tenant-a', selected),
      analyticsApi.activity('tenant-a', selected, 'month'),
      analyticsApi.concepts('tenant-a', selected),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const urls = fetchMock.mock.calls.map(
      ([url]) => new URL(String(url), 'https://test.local')
    );
    for (const url of urls) {
      expect(url.pathname).toContain('/tenants/tenant-a/analytics/');
      expect(url.searchParams.get('siteId')).toBe('site-north');
      expect(url.searchParams.get('workTypeId')).toBe('visual');
      expect(url.searchParams.get('assetTypeId')).toBe('transformer');
      expect(url.searchParams.get('from')).toBe('2026-03-01');
      expect(url.searchParams.get('to')).toBe('2026-09-01');
    }
  });

  it('requests the new site and date range after a filter change', async () => {
    await analyticsApi.summary('tenant-a', filters);
    await analyticsApi.summary('tenant-a', {
      ...filters,
      siteId: 'mine-north',
      from: '2026-08-03',
    });

    const first = new URL(
      String(fetchMock.mock.calls[0][0]),
      'https://test.local'
    );
    const second = new URL(
      String(fetchMock.mock.calls[1][0]),
      'https://test.local'
    );
    expect(first.searchParams.has('siteId')).toBe(false);
    expect(second.searchParams.get('siteId')).toBe('mine-north');
    expect(second.searchParams.get('from')).toBe('2026-08-03');
  });
});
