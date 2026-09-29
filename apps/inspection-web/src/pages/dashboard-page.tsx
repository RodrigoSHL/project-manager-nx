import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Gauge,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { assetCatalogApi } from '../features/assets/asset-catalog-api';
import type { Site } from '../features/assets/models';
import type { AssetType } from '../features/asset-types/models';
import type { WorkType } from '../features/work-types/models';
import { useAuth } from '../features/auth/auth-context';
import { useOffline } from '../features/offline/offline-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../features/tenants/organization-selection-storage';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { analyticsApi } from '../features/analytics/analytics-api';
import {
  analyticsFilters,
  changeDashboardFilters,
  readDashboardFilters,
  type DashboardFilterValues,
} from '../features/analytics/dashboard-filters';
import { useAnalyticsSection } from '../features/analytics/use-analytics-section';
import { DashboardFilters } from '../features/analytics/components/dashboard-filters';
import { DashboardSection } from '../features/analytics/components/dashboard-section';
import { MetricCard } from '../features/analytics/components/metric-card';
import {
  FindingsBySeverityChart,
  WorkActivityChart,
} from '../features/analytics/components/dashboard-charts';
import {
  AvailableConcepts,
  FindingsByAssetTypeList,
  TopAssetsByFindings,
} from '../features/analytics/components/dashboard-rankings';
import { MeasurementsStatusCard } from '../features/analytics/components/measurements-status-card';

type FilterOptions = {
  sites: Site[];
  workTypes: WorkType[];
  assetTypes: AssetType[];
};
const emptyOptions: FilterOptions = {
  sites: [],
  workTypes: [],
  assetTypes: [],
};

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const tenantAccess = useTenantAccess();
  const { mode } = useOffline();
  const [options, setOptions] = useState<FilterOptions>(emptyOptions);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const tenantId = resolveAvailableSelection(
    tenantAccess.accessibleTenants,
    searchParams.get('tenantId'),
    organizationSelectionStorage.getTenantId(user?.userId ?? '')
  );
  const filters = readDashboardFilters(searchParams);
  const analytics = analyticsFilters(filters);
  const filterKey = JSON.stringify(analytics);
  const initialized = Boolean(
    tenantId &&
      searchParams.get('tenantId') === tenantId &&
      searchParams.get('period') &&
      searchParams.get('from') &&
      searchParams.get('to')
  );
  const enabled =
    initialized && mode === 'REMOTE' && filters.from <= filters.to;
  const groupBy =
    filters.period === '30d' ||
    (filters.period === 'custom' &&
      Date.parse(filters.to) - Date.parse(filters.from) <= 90 * 86400000)
      ? 'day'
      : 'month';

  useEffect(() => {
    if (!tenantId || tenantAccess.isLoading || initialized) return;
    const next = changeDashboardFilters(searchParams, {
      period: filters.period,
      from: filters.from,
      to: filters.to,
    });
    if (searchParams.get('tenantId') !== tenantId) {
      next.delete('siteId');
      next.delete('workTypeId');
      next.delete('assetTypeId');
    }
    next.set('tenantId', tenantId);
    setSearchParams(next, { replace: true });
  }, [
    tenantId,
    tenantAccess.isLoading,
    initialized,
    filters.period,
    filters.from,
    filters.to,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!tenantId || mode !== 'REMOTE') {
      setOptions(emptyOptions);
      return;
    }
    const controller = new AbortController();
    setOptions(emptyOptions);
    setOptionsLoading(true);
    setOptionsError(null);
    Promise.all([
      assetCatalogApi.listSites(tenantId, controller.signal),
      assetCatalogApi.listWorkTypes(tenantId, controller.signal),
      assetCatalogApi.listAssetTypes(tenantId, controller.signal),
    ])
      .then(([sites, workTypes, assetTypes]) => {
        if (!controller.signal.aborted)
          setOptions({ sites, workTypes, assetTypes });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setOptionsError(
            error instanceof Error ? error.message : 'Error de catálogos'
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [tenantId, mode]);

  const summary = useAnalyticsSection(
    enabled,
    (signal) => analyticsApi.summary(tenantId, analytics, signal),
    [tenantId, filterKey]
  );
  const findings = useAnalyticsSection(
    enabled,
    (signal) => analyticsApi.findings(tenantId, analytics, signal),
    [tenantId, filterKey]
  );
  const activity = useAnalyticsSection(
    enabled,
    (signal) => analyticsApi.activity(tenantId, analytics, groupBy, signal),
    [tenantId, filterKey, groupBy]
  );
  const concepts = useAnalyticsSection(
    enabled,
    (signal) => analyticsApi.concepts(tenantId, analytics, signal),
    [tenantId, filterKey]
  );
  const selectedTenant = tenantAccess.accessibleTenants.find(
    (tenant) => tenant.id === tenantId
  );
  const linkSearch = useMemo(
    () => `?${searchParams.toString()}`,
    [searchParams]
  );

  function updateFilters(change: Partial<DashboardFilterValues>) {
    setSearchParams(changeDashboardFilters(searchParams, change));
  }
  function updateTenant(nextTenantId: string) {
    organizationSelectionStorage.rememberTenant(
      user?.userId ?? '',
      nextTenantId
    );
    const next = new URLSearchParams(searchParams);
    next.set('tenantId', nextTenantId);
    next.delete('siteId');
    next.delete('workTypeId');
    next.delete('assetTypeId');
    setSearchParams(next);
  }

  const number = (value?: number) =>
    value === undefined ? '—' : value.toLocaleString('es-CL');
  const summaryData = summary.data;
  const severityLeader = summaryData?.findingsBySeverity[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Estado general de las inspecciones realizadas${
          selectedTenant ? ` para ${selectedTenant.name}` : ''
        }. Los valores provienen de Analytics.`}
      />
      {tenantAccess.isLoading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Cargando empresas disponibles…
        </p>
      ) : !tenantId ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No tienes una empresa disponible para consultar Analytics.
        </p>
      ) : (
        <>
          <DashboardFilters
            filters={filters}
            tenants={tenantAccess.accessibleTenants}
            tenantId={tenantId}
            sites={options.sites}
            workTypes={options.workTypes}
            assetTypes={options.assetTypes}
            loadingOptions={optionsLoading}
            optionsError={optionsError}
            onTenantChange={updateTenant}
            onChange={updateFilters}
          />
          {mode !== 'REMOTE' ? (
            <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              El dashboard ejecutivo necesita conexión con el servidor. Tus
              datos de trabajo offline siguen disponibles en las otras
              secciones.
            </p>
          ) : filters.from > filters.to ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              La fecha inicial debe ser anterior o igual a la final.
            </p>
          ) : (
            <>
              {summaryData && summaryData.totalWorks === 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                  <strong className="block text-base text-slate-950">
                    Aún no existen trabajos suficientes para mostrar métricas.
                  </strong>
                  Las estadísticas aparecerán cuando comiencen a finalizarse
                  trabajos para este período.
                </div>
              )}
              <section
                className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Indicadores principales"
              >
                <MetricCard
                  label="Trabajos realizados"
                  value={number(summaryData?.totalWorks)}
                  detail="Trabajos finalizados o revisados"
                  icon={ClipboardList}
                  loading={summary.loading || !initialized}
                  error={summary.error}
                />
                <MetricCard
                  label="Activos inspeccionados"
                  value={number(summaryData?.totalInspectedAssets)}
                  detail="Activos únicos, incluidos los hijos inspeccionados"
                  icon={ClipboardCheck}
                  loading={summary.loading || !initialized}
                  error={summary.error}
                />
                <MetricCard
                  label="Hallazgos"
                  value={number(summaryData?.totalFindings)}
                  detail={
                    severityLeader
                      ? `${severityLeader.count} en ${severityLeader.name}`
                      : 'Hallazgos confirmados'
                  }
                  icon={AlertTriangle}
                  to={`/findings${linkSearch}`}
                  loading={summary.loading || !initialized}
                  error={summary.error}
                />
                <MetricCard
                  label="Mediciones en rango"
                  value={
                    summaryData?.measurementsEvaluable
                      ? `${number(
                          Math.round(summaryData.percentageInRange ?? 0)
                        )} %`
                      : '—'
                  }
                  detail={
                    summaryData?.measurementsEvaluable
                      ? `${number(summaryData.measurementsInRange)} de ${number(
                          summaryData.measurementsEvaluable
                        )} mediciones evaluables`
                      : 'Sin mediciones evaluables'
                  }
                  icon={Gauge}
                  loading={summary.loading || !initialized}
                  error={summary.error}
                />
              </section>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <DashboardSection
                  title="Hallazgos por criticidad"
                  state={summary}
                  isEmpty={(data) =>
                    data.totalFindings === 0 ||
                    data.findingsBySeverity.length === 0
                  }
                >
                  {(data) => (
                    <FindingsBySeverityChart rows={data.findingsBySeverity} />
                  )}
                </DashboardSection>
                <DashboardSection
                  title="Trabajos realizados en el tiempo"
                  state={activity}
                  isEmpty={(data) => data.length === 0}
                >
                  {(data) => <WorkActivityChart rows={data} />}
                </DashboardSection>
                <DashboardSection
                  title="Activos con más hallazgos"
                  state={findings}
                  isEmpty={(data) => data.byAsset.length === 0}
                >
                  {(data) => (
                    <TopAssetsByFindings
                      rows={data.byAsset}
                      search={linkSearch}
                    />
                  )}
                </DashboardSection>
                <DashboardSection
                  title="Hallazgos por tipo de activo"
                  state={findings}
                  isEmpty={(data) => data.byAssetType.length === 0}
                >
                  {(data) => (
                    <FindingsByAssetTypeList rows={data.byAssetType} />
                  )}
                </DashboardSection>
                <DashboardSection
                  title="Estado de mediciones"
                  state={summary}
                  isEmpty={(data) => data.measurementsEvaluable === 0}
                >
                  {(data) => <MeasurementsStatusCard summary={data} />}
                </DashboardSection>
                <DashboardSection
                  title="Mediciones disponibles para análisis"
                  state={concepts}
                  isEmpty={(data) => data.length === 0}
                >
                  {(data) => (
                    <AvailableConcepts rows={data} search={linkSearch} />
                  )}
                </DashboardSection>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
