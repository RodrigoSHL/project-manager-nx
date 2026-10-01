import { useEffect, useMemo, useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { assetCatalogApi } from '../features/assets/asset-catalog-api';
import type { Site } from '../features/assets/models';
import type { AssetType } from '../features/asset-types/models';
import type { WorkType } from '../features/work-types/models';
import { useAuth } from '../features/auth/auth-context';
import { analyticsApi } from '../features/analytics/analytics-api';
import {
  analyticsFilters,
  changeDashboardFilters,
  readDashboardFilters,
  type DashboardFilterValues,
} from '../features/analytics/dashboard-filters';
import { MeasurementAssets } from '../features/analytics/components/measurement-assets';
import { MeasurementChart } from '../features/analytics/components/measurement-chart';
import { MeasurementDetail } from '../features/analytics/components/measurement-detail';
import { MeasurementFilters } from '../features/analytics/components/measurement-filters';
import { MeasurementStatCard } from '../features/analytics/components/measurement-stat-card';
import {
  MAX_CHART_POINTS,
  formatMeasurementDate,
  formatMeasurementValue,
  measurementStatus,
  parseAssetIds,
} from '../features/analytics/measurement-comparison';
import { useAnalyticsSection } from '../features/analytics/use-analytics-section';
import { useOffline } from '../features/offline/offline-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../features/tenants/organization-selection-storage';
import { useTenantAccess } from '../features/tenants/tenant-access-context';

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

export function MeasurementAnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const [options, setOptions] = useState<FilterOptions>(emptyOptions);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState('');
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    params.get('tenantId'),
    organizationSelectionStorage.getTenantId(user?.userId ?? '')
  );
  const values = readDashboardFilters(params);
  const filters = analyticsFilters(values);
  const filterKey = JSON.stringify(filters);
  const conceptId = params.get('conceptId') ?? '';
  const assetIds = parseAssetIds(params.get('assetIds'));
  const initialized = Boolean(
    tenantId &&
      params.get('tenantId') === tenantId &&
      params.get('period') &&
      params.get('from') &&
      params.get('to')
  );
  const enabled = initialized && mode === 'REMOTE' && values.from <= values.to;

  useEffect(() => {
    if (!tenantId || access.isLoading || initialized) return;
    const next = changeDashboardFilters(params, {
      period: values.period,
      from: values.from,
      to: values.to,
    });
    if (params.get('tenantId') && params.get('tenantId') !== tenantId) {
      for (const key of [
        'siteId',
        'workTypeId',
        'assetTypeId',
        'conceptId',
        'assetIds',
      ])
        next.delete(key);
    }
    next.set('tenantId', tenantId);
    setParams(next, { replace: true });
  }, [
    tenantId,
    access.isLoading,
    initialized,
    params,
    setParams,
    values.period,
    values.from,
    values.to,
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

  const concepts = useAnalyticsSection(
    enabled,
    (signal) => analyticsApi.concepts(tenantId, filters, signal),
    [tenantId, filterKey]
  );
  const selectedConcept = concepts.data?.find(
    (concept) => concept.id === conceptId
  );
  const discovery = useAnalyticsSection(
    enabled && !!selectedConcept,
    (signal) =>
      analyticsApi.measurements(tenantId, conceptId, filters, [], signal, 1),
    [tenantId, conceptId, filterKey]
  );
  const candidates = discovery.data?.series ?? [];
  const candidateIds = useMemo(
    () => new Set(candidates.map((asset) => asset.assetId)),
    [candidates]
  );
  const selectedIds = assetIds.filter((id) => candidateIds.has(id));
  const comparisonKey = selectedIds.join(',');
  const comparison = useAnalyticsSection(
    enabled && !!selectedConcept && !!discovery.data && selectedIds.length > 0,
    (signal) =>
      analyticsApi.measurements(
        tenantId,
        conceptId,
        filters,
        selectedIds,
        signal,
        MAX_CHART_POINTS
      ),
    [tenantId, conceptId, filterKey, comparisonKey]
  );
  const tooManyPoints =
    (comparison.data?.totalMeasurements ?? 0) > MAX_CHART_POINTS;
  const series = comparison.data?.series ?? [];
  const allPoints = series
    .flatMap((asset) => asset.measurements.map((point) => ({ asset, point })))
    .sort(
      (a, b) =>
        b.point.measuredAt.localeCompare(a.point.measuredAt) ||
        b.point.workDate.localeCompare(a.point.workDate) ||
        b.point.responseId.localeCompare(a.point.responseId)
    );
  const selected =
    allPoints.find(({ point }) => point.responseId === selectedPointId) ??
    allPoints[0];
  const backParams = new URLSearchParams(params);
  backParams.delete('conceptId');
  backParams.delete('assetIds');
  backParams.delete('returnTo');

  function updateFilters(change: Partial<DashboardFilterValues>) {
    const next = changeDashboardFilters(params, change);
    if (
      change.siteId !== undefined ||
      change.workTypeId !== undefined ||
      change.assetTypeId !== undefined
    )
      next.delete('assetIds');
    setParams(next);
  }
  function updateTenant(nextTenantId: string) {
    organizationSelectionStorage.rememberTenant(
      user?.userId ?? '',
      nextTenantId
    );
    const next = new URLSearchParams(params);
    next.set('tenantId', nextTenantId);
    for (const key of [
      'siteId',
      'workTypeId',
      'assetTypeId',
      'conceptId',
      'assetIds',
    ])
      next.delete(key);
    setParams(next);
  }
  function updateConcept(nextConceptId: string) {
    const next = new URLSearchParams(params);
    if (nextConceptId) next.set('conceptId', nextConceptId);
    else next.delete('conceptId');
    next.delete('assetIds');
    setParams(next);
  }
  function updateAssets(nextIds: string[]) {
    const next = new URLSearchParams(params);
    if (nextIds.length) next.set('assetIds', nextIds.join(','));
    else next.delete('assetIds');
    setParams(next);
  }

  return (
    <>
      <PageHeader
        title="Análisis de mediciones"
        description="Compara mediciones históricas de inspecciones ejecutadas entre activos para un mismo concepto."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/dashboard?${backParams.toString()}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Volver al dashboard
        </Link>
        <Link
          to={`/analytics/variables?${params.toString()}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
        >
          <ChartNoAxesCombined className="size-4" aria-hidden="true" />
          Comparar variables
        </Link>
      </div>
      {access.isLoading ? (
        <Message text="Cargando empresas disponibles…" />
      ) : !tenantId ? (
        <Message text="No tienes una empresa disponible para consultar mediciones." />
      ) : (
        <>
          <MeasurementFilters
            filters={values}
            tenants={access.accessibleTenants}
            tenantId={tenantId}
            sites={options.sites}
            workTypes={options.workTypes}
            assetTypes={options.assetTypes}
            concepts={concepts.data ?? []}
            conceptId={conceptId}
            loadingOptions={optionsLoading}
            loadingConcepts={concepts.loading || !initialized}
            optionsError={optionsError}
            onTenantChange={updateTenant}
            onConceptChange={updateConcept}
            onChange={updateFilters}
          />
          {mode !== 'REMOTE' ? (
            <Message text="El comparador técnico necesita conexión con el servidor. Las inspecciones offline siguen disponibles en sus secciones." />
          ) : values.from > values.to ? (
            <Message
              text="La fecha inicial debe ser anterior o igual a la final."
              error
            />
          ) : concepts.loading || !initialized ? (
            <Message text="Cargando conceptos con historial…" />
          ) : concepts.error ? (
            <Message text={concepts.error} error />
          ) : !conceptId ? (
            <Message text="Selecciona un concepto analógico para descubrir los activos con mediciones en este período." />
          ) : !selectedConcept ? (
            <Message text="Este concepto no tiene mediciones para los filtros seleccionados. Elige otro concepto o amplía el período." />
          ) : (
            <div className="mt-6 space-y-6">
              {discovery.loading ? (
                <Message text="Buscando activos con historial…" />
              ) : discovery.error ? (
                <Message text={discovery.error} error />
              ) : !candidates.length ? (
                <Message text="Aún no existen mediciones para este concepto en el período seleccionado." />
              ) : (
                <>
                  <MeasurementAssets
                    candidates={candidates}
                    selectedIds={selectedIds}
                    onChange={updateAssets}
                  />
                  {!selectedIds.length ? (
                    <Message text="Selecciona uno o varios activos para comparar sus mediciones." />
                  ) : comparison.loading ? (
                    <Message text="Cargando series históricas…" />
                  ) : comparison.error ? (
                    <Message text={comparison.error} error />
                  ) : comparison.data ? (
                    <>
                      <section
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                        aria-label="Evolución histórica"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-semibold text-slate-950">
                              Evolución histórica
                            </h2>
                            <p className="text-sm text-slate-500">
                              {selectedConcept.name}
                              {selectedConcept.unit
                                ? ` · ${selectedConcept.unit}`
                                : ''}{' '}
                              ·{' '}
                              {comparison.data.totalMeasurements.toLocaleString(
                                'es-CL'
                              )}{' '}
                              mediciones
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {values.from} al {values.to}
                          </p>
                        </div>
                        {tooManyPoints ? (
                          <Message
                            text={`Hay más de ${MAX_CHART_POINTS} puntos. Acota el sitio, los activos o el período para ver el gráfico completo sin omitir mediciones.`}
                          />
                        ) : (
                          <MeasurementChart
                            series={series}
                            unit={selectedConcept.unit}
                            onSelect={setSelectedPointId}
                          />
                        )}
                      </section>
                      {!tooManyPoints && selected && (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
                          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-950">
                              Mediciones recientes
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                              Selecciona un registro para ver su Work, rango
                              histórico y hallazgo.
                            </p>
                            <ul className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto">
                              {allPoints
                                .slice(0, 30)
                                .map(({ asset, point }) => (
                                  <li key={point.responseId}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedPointId(point.responseId)
                                      }
                                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-slate-50 ${
                                        selected.point.responseId ===
                                        point.responseId
                                          ? 'bg-slate-100'
                                          : ''
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium text-slate-900">
                                          {asset.assetName} ·{' '}
                                          {formatMeasurementValue(
                                            point.value,
                                            selectedConcept.unit
                                          )}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {formatMeasurementDate(
                                            point.measuredAt
                                          )}{' '}
                                          · {measurementStatus(point)}
                                        </span>
                                      </span>
                                      <span
                                        aria-hidden="true"
                                        className={
                                          point.isInRange === false
                                            ? 'text-orange-700'
                                            : 'text-slate-500'
                                        }
                                      >
                                        {point.isInRange === false
                                          ? '▲'
                                          : point.isInRange === true
                                          ? '●'
                                          : '■'}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          </section>
                          <MeasurementDetail
                            asset={selected.asset}
                            point={selected.point}
                            tenantId={tenantId}
                            unit={selectedConcept.unit}
                          />
                        </div>
                      )}
                      <section aria-label="Resumen por activo">
                        <h2 className="mb-4 text-xl font-semibold text-slate-950">
                          Resumen por activo
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {series.map((asset) => (
                            <MeasurementStatCard
                              key={asset.assetId}
                              series={asset}
                              unit={selectedConcept.unit}
                              tenantId={tenantId}
                              search={params.toString()}
                            />
                          ))}
                        </div>
                      </section>
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function Message({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`mt-6 rounded-xl border p-6 text-sm ${
        error
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {text}
    </p>
  );
}
