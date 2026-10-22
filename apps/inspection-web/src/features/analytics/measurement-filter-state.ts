import {
  changeDashboardFilters,
  type DashboardFilterValues,
} from './dashboard-filters';

export function applyMeasurementFilterSelection(
  current: URLSearchParams,
  tenantId: string,
  filters: DashboardFilterValues
) {
  const changingTenant = tenantId !== current.get('tenantId');
  const next = changeDashboardFilters(current, {
    ...filters,
    siteId: changingTenant ? '' : filters.siteId ?? '',
    workTypeId: changingTenant ? '' : filters.workTypeId ?? '',
    assetTypeId: changingTenant ? '' : filters.assetTypeId ?? '',
  });
  next.set('tenantId', tenantId);
  if (changingTenant) next.delete('conceptId');
  if (
    changingTenant ||
    ['siteId', 'workTypeId', 'assetTypeId'].some(
      (key) => (current.get(key) ?? '') !== (next.get(key) ?? '')
    )
  )
    next.delete('assetIds');
  return next;
}
