import { authenticatedFetch } from '../auth/authenticated-fetch';
import type {
  ActivityPoint,
  AnalyticsConcept,
  AnalyticsFilters,
  AnalyticsFindings,
  AnalyticsSummary,
  AssetHistory,
} from './models';

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

function path(
  tenantId: string,
  endpoint: string,
  filters: Partial<AnalyticsFilters> &
    Record<string, string | number | undefined> = {}
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return `${baseUrl}/tenants/${encodeURIComponent(
    tenantId
  )}/analytics/${endpoint}${search ? `?${search}` : ''}`;
}

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await authenticatedFetch(url, { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message || 'No fue posible cargar Analytics.');
  }
  return response.json() as Promise<T>;
}

export const analyticsApi = {
  summary(tenantId: string, filters: AnalyticsFilters, signal?: AbortSignal) {
    return get<AnalyticsSummary>(path(tenantId, 'summary', filters), signal);
  },
  findings(
    tenantId: string,
    filters: AnalyticsFilters,
    signal?: AbortSignal,
    page = 1,
    pageSize = 25,
    limit = 10
  ) {
    return get<AnalyticsFindings>(
      path(tenantId, 'findings', { ...filters, page, pageSize, limit }),
      signal
    );
  },
  activity(
    tenantId: string,
    filters: AnalyticsFilters,
    groupBy: 'day' | 'week' | 'month',
    signal?: AbortSignal
  ) {
    return get<ActivityPoint[]>(
      path(tenantId, 'activity', { ...filters, groupBy }),
      signal
    );
  },
  concepts(tenantId: string, filters: AnalyticsFilters, signal?: AbortSignal) {
    return get<AnalyticsConcept[]>(path(tenantId, 'concepts', filters), signal);
  },
  assetHistory(
    tenantId: string,
    assetId: string,
    filters: AnalyticsFilters,
    signal?: AbortSignal,
    page = 1
  ) {
    return get<AssetHistory>(
      path(tenantId, `assets/${encodeURIComponent(assetId)}/history`, {
        ...filters,
        page,
      }),
      signal
    );
  },
};
