import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { assetCatalogApi } from '../features/assets/asset-catalog-api';
import type { Asset, Site } from '../features/assets/models';
import { useAuth } from '../features/auth/auth-context';
import { analyticsApi } from '../features/analytics/analytics-api';
import { VariableComparisonChart } from '../features/analytics/components/variable-comparison-chart';
import {
  presetDates,
  type PeriodPreset,
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

const selectClass =
  'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900';
type Pair = { assetId: string; conceptId: string };

export function VariableComparisonPage() {
  const { user } = useAuth();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const [tenantChoice, setTenantChoice] = useState('');
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    tenantChoice,
    organizationSelectionStorage.getTenantId(user?.userId ?? '')
  );
  const [siteId, setSiteId] = useState('');
  const [period, setPeriod] = useState<PeriodPreset>('6m');
  const [dates, setDates] = useState(() => presetDates('6m'));
  const [first, setFirst] = useState<Pair>({ assetId: '', conceptId: '' });
  const [second, setSecond] = useState<Pair>({ assetId: '', conceptId: '' });
  const filter = { siteId, from: dates.from, to: dates.to };
  const validPeriod = dates.from <= dates.to;
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

  function pairFields(
    label: string,
    value: Pair,
    update: (pair: Pair) => void
  ) {
    return (
      <fieldset className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <legend className="px-1 font-semibold text-slate-900">{label}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Activo
            <select
              className={selectClass}
              value={value.assetId}
              onChange={(event) =>
                update({ ...value, assetId: event.target.value })
              }
              disabled={!siteId || assets.loading}
            >
              <option value="">Selecciona un activo</option>
              {(assets.data ?? []).map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {asset.code}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Concepto analógico
            <select
              className={selectClass}
              value={value.conceptId}
              onChange={(event) =>
                update({ ...value, conceptId: event.target.value })
              }
              disabled={!siteId || concepts.loading}
            >
              <option value="">Selecciona un concepto</option>
              {(concepts.data ?? []).map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.name}
                  {concept.unit ? ` (${concept.unit})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
    );
  }

  const tooMany =
    result.data?.some((item) => item.totalMeasurements > MAX_VARIABLE_POINTS) ??
    false;
  const selectedWithoutData =
    result.data?.some((item) => !item.series.length) ?? false;

  return (
    <>
      <PageHeader
        title="Comparar variables"
        description="Observa dos conceptos analógicos, incluso de activos distintos, sobre una misma línea de tiempo. Las mediciones provienen de trabajos finalizados o revisados."
      />
      <Link
        to="/dashboard"
        className="mb-5 inline-block text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Volver al dashboard
      </Link>
      {mode !== 'REMOTE' ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          El comparador histórico requiere conexión. Puedes seguir registrando
          mediciones y sincronizarlas después.
        </p>
      ) : (
        <div className="space-y-5">
          <section
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:p-5"
            aria-label="Filtros de comparación"
          >
            <label className="text-sm font-medium text-slate-700">
              Empresa
              <select
                className={selectClass}
                value={tenantId}
                onChange={(event) => updateTenant(event.target.value)}
              >
                {access.accessibleTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Faena / Sitio
              <select
                className={selectClass}
                value={siteId}
                onChange={(event) => updateSite(event.target.value)}
                disabled={sites.loading}
              >
                <option value="">Selecciona una faena</option>
                {(sites.data ?? []).map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Período
              <select
                className={selectClass}
                value={period}
                onChange={(event) =>
                  updatePeriod(event.target.value as PeriodPreset)
                }
              >
                <option value="30d">Últimos 30 días</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="12m">Últimos 12 meses</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-slate-700">
                Desde
                <input
                  className={selectClass}
                  type="date"
                  value={dates.from}
                  max={dates.to}
                  onChange={(event) => {
                    setPeriod('custom');
                    setDates((current) => ({
                      ...current,
                      from: event.target.value,
                    }));
                  }}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Hasta
                <input
                  className={selectClass}
                  type="date"
                  value={dates.to}
                  min={dates.from}
                  onChange={(event) => {
                    setPeriod('custom');
                    setDates((current) => ({
                      ...current,
                      to: event.target.value,
                    }));
                  }}
                />
              </label>
            </div>
          </section>
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
          {pairFields('Variable A', first, setFirst)}
          {pairFields('Variable B', second, setSecond)}
          {!siteId && (
            <p className="text-sm text-slate-600">
              Selecciona una faena para cargar sus activos y conceptos medidos.
            </p>
          )}
          {siteId && !bothSelected && (
            <p className="text-sm text-slate-600">
              Elige un activo y un concepto para cada variable.
            </p>
          )}
          {samePair && (
            <p role="alert" className="text-sm text-amber-800">
              Elige dos pares activo–concepto distintos.
            </p>
          )}
          {!validPeriod && (
            <p role="alert" className="text-sm text-red-700">
              La fecha inicial debe ser anterior a la final.
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
