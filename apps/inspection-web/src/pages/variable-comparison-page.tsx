import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { assetCatalogApi } from '../features/assets/asset-catalog-api';
import type { Asset, Site } from '../features/assets/models';
import { useAuth } from '../features/auth/auth-context';
import { analyticsApi } from '../features/analytics/analytics-api';
import { VariableComparisonChart } from '../features/analytics/components/variable-comparison-chart';
import { DashboardFilters } from '../features/analytics/components/dashboard-filters';
import {
  VariablePairSelector,
  type VariablePair as Pair,
} from '../features/analytics/components/variable-pair-selector';
import {
  changeDashboardFilters,
  presetDates,
  readDashboardFilters,
  type PeriodPreset,
  type DashboardFilterValues,
} from '../features/analytics/dashboard-filters';
import type { AnalyticsMeasurements } from '../features/analytics/models';
import { useAnalyticsSection } from '../features/analytics/use-analytics-section';
import { MAX_VARIABLE_POINTS } from '../features/analytics/variable-comparison';
import { useOffline } from '../features/offline/offline-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../features/tenants/organization-selection-storage';
import { useTenantAccess } from '../features/tenants/tenant-access-context';

export function VariableComparisonPage() {
  const [searchParams] = useSearchParams();
  const [initialFilters] = useState(() => readDashboardFilters(searchParams));
  const { user } = useAuth();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const [tenantChoice, setTenantChoice] = useState(
    () => searchParams.get('tenantId') ?? ''
  );
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    tenantChoice,
    organizationSelectionStorage.getTenantId(user?.userId ?? '')
  );
  const [siteId, setSiteId] = useState(initialFilters.siteId ?? '');
  const [period, setPeriod] = useState<PeriodPreset>(initialFilters.period);
  const [dates, setDates] = useState({
    from: initialFilters.from,
    to: initialFilters.to,
  });
  const [first, setFirst] = useState<Pair>({ assetId: '', conceptId: '' });
  const [second, setSecond] = useState<Pair>({ assetId: '', conceptId: '' });
  const filter = { siteId, from: dates.from, to: dates.to };
  const validPeriod = Boolean(dates.from && dates.to && dates.from <= dates.to);
  const enabled = mode === 'REMOTE' && !!tenantId;

  const sites = useAnalyticsSection<Site[]>(
    enabled,
    (signal) => assetCatalogApi.listSites(tenantId, signal),
    [tenantId]
  );
  const assets = useAnalyticsSection<Asset[]>(
    enabled && !!siteId,
    (signal) => assetCatalogApi.listAssets(tenantId, siteId, signal),
    [tenantId, siteId]
  );
  const concepts = useAnalyticsSection(
    enabled && !!siteId && validPeriod,
    (signal) => analyticsApi.concepts(tenantId, filter, signal),
    [tenantId, siteId, dates.from, dates.to]
  );
  const bothSelected =
    !!first.assetId &&
    !!first.conceptId &&
    !!second.assetId &&
    !!second.conceptId;
  const samePair =
    bothSelected &&
    first.assetId === second.assetId &&
    first.conceptId === second.conceptId;
  const result = useAnalyticsSection<
    [AnalyticsMeasurements, AnalyticsMeasurements]
  >(
    enabled && !!siteId && validPeriod && bothSelected && !samePair,
    (signal) =>
      Promise.all([
        analyticsApi.measurements(
          tenantId,
          first.conceptId,
          filter,
          [first.assetId],
          signal,
          MAX_VARIABLE_POINTS
        ),
        analyticsApi.measurements(
          tenantId,
          second.conceptId,
          filter,
          [second.assetId],
          signal,
          MAX_VARIABLE_POINTS
        ),
      ]),
    [
      tenantId,
      siteId,
      dates.from,
      dates.to,
      first.assetId,
      first.conceptId,
      second.assetId,
      second.conceptId,
    ]
  );

  useEffect(() => {
    if (!siteId || !sites.data || sites.data.some((site) => site.id === siteId))
      return;
    setSiteId('');
  }, [siteId, sites.data]);

  useEffect(() => {
    if (!concepts.data) return;
    const available = new Set(concepts.data.map((concept) => concept.id));
    setFirst((current) =>
      current.conceptId && !available.has(current.conceptId)
        ? { ...current, conceptId: '' }
        : current
    );
    setSecond((current) =>
      current.conceptId && !available.has(current.conceptId)
        ? { ...current, conceptId: '' }
        : current
    );
  }, [concepts.data]);

  function updateTenant(next: string) {
    organizationSelectionStorage.rememberTenant(user?.userId ?? '', next);
    setTenantChoice(next);
    setSiteId('');
    setFirst({ assetId: '', conceptId: '' });
    setSecond({ assetId: '', conceptId: '' });
  }

  function updateSite(next: string) {
    setSiteId(next);
    setFirst({ assetId: '', conceptId: '' });
    setSecond({ assetId: '', conceptId: '' });
  }

  function updatePeriod(next: PeriodPreset) {
    setPeriod(next);
    if (next !== 'custom') setDates(presetDates(next));
  }

  function applyFilters(nextTenantId: string, next: DashboardFilterValues) {
    if (nextTenantId !== tenantId) updateTenant(nextTenantId);
    else if ((next.siteId ?? '') !== siteId) updateSite(next.siteId ?? '');
    setPeriod(next.period);
    setDates({ from: next.from, to: next.to });
  }

  const returnParams = changeDashboardFilters(searchParams, {
    period,
    ...dates,
    siteId,
  });
  returnParams.set('tenantId', tenantId);
  if (tenantId !== searchParams.get('tenantId')) {
    for (const key of ['conceptId', 'assetIds', 'workTypeId', 'assetTypeId'])
      returnParams.delete(key);
  } else if (siteId !== (searchParams.get('siteId') ?? ''))
    returnParams.delete('assetIds');

  const tooMany =
    result.data?.some((item) => item.totalMeasurements > MAX_VARIABLE_POINTS) ??
    false;
  const selectedWithoutData =
    result.data?.some((item) => !item.series.length) ?? false;

  return (
    <>
      <PageHeader
        title="Comparar variables"
        description="Elige dos mediciones y compara su evolución en el tiempo."
      />
      <Link
        to={`/analytics/measurements?${returnParams.toString()}`}
        className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Volver a mediciones
      </Link>
      {mode !== 'REMOTE' ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          El comparador histórico requiere conexión. Puedes seguir registrando
          mediciones y sincronizarlas después.
        </p>
      ) : (
        <div className="min-w-0 space-y-4 md:space-y-5">
          <DashboardFilters
            label="Filtros de comparación"
            showTypeFilters={false}
            emptySiteLabel="Selecciona una faena"
            filters={{ period, ...dates, siteId }}
            tenantId={tenantId}
            tenants={access.accessibleTenants}
            sites={sites.data ?? []}
            workTypes={[]}
            assetTypes={[]}
            loadingOptions={sites.loading}
            optionsError={null}
            onTenantChange={updateTenant}
            onChange={(change) => {
              if (change.siteId !== undefined) updateSite(change.siteId);
              if (change.period) updatePeriod(change.period);
              if (change.from !== undefined || change.to !== undefined) {
                setPeriod('custom');
                setDates((current) => ({
                  from: change.from ?? current.from,
                  to: change.to ?? current.to,
                }));
              }
            }}
            onApply={applyFilters}
          />
          {[sites.error, assets.error, concepts.error, result.error]
            .filter(Boolean)
            .map((error) => (
              <p
                key={error}
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            ))}
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <VariablePairSelector
              label="Variable A"
              value={first}
              onChange={setFirst}
              assets={assets.data ?? []}
              concepts={concepts.data ?? []}
              disabled={!siteId || !validPeriod}
              loading={assets.loading || concepts.loading}
            />
            <VariablePairSelector
              label="Variable B"
              value={second}
              onChange={setSecond}
              assets={assets.data ?? []}
              concepts={concepts.data ?? []}
              disabled={!siteId || !validPeriod}
              loading={assets.loading || concepts.loading}
            />
          </div>
          {!siteId && (
            <p className="text-sm text-slate-600">
              Abre Filtros y selecciona una faena para comenzar.
            </p>
          )}
          {siteId && !bothSelected && (
            <p className="text-sm text-slate-600">
              Elige un activo y una medición para cada variable.
            </p>
          )}
          {samePair && (
            <p role="alert" className="text-sm text-amber-800">
              Elige dos pares activo–concepto distintos.
            </p>
          )}
          {!validPeriod && (
            <p role="alert" className="text-sm text-red-700">
              Completa el período; la fecha inicial debe ser anterior o igual a
              la final.
            </p>
          )}
          {result.loading && (
            <p role="status" className="text-sm text-slate-600">
              Cargando mediciones…
            </p>
          )}
          {tooMany && (
            <p
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              Hay más de {MAX_VARIABLE_POINTS} mediciones en al menos una
              variable. Acota el período para mostrar una comparación completa.
            </p>
          )}
          {selectedWithoutData && !tooMany && (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Uno de los pares elegidos no tiene mediciones en este período.
              Prueba otro activo o concepto.
            </p>
          )}
          {result.data && !tooMany && !selectedWithoutData && (
            <VariableComparisonChart
              first={result.data[0]}
              second={result.data[1]}
              tenantId={tenantId}
            />
          )}
          <p className="text-xs text-slate-500">
            La coincidencia temporal de dos curvas puede sugerir una relación,
            pero no demuestra causalidad. La hora es opcional y corresponde a la
            hora local registrada en la faena.
          </p>
        </div>
      )}
    </>
  );
}
