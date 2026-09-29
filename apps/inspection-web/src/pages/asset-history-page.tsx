import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { analyticsApi } from '../features/analytics/analytics-api';
import {
  analyticsFilters,
  readDashboardFilters,
} from '../features/analytics/dashboard-filters';
import { useAnalyticsSection } from '../features/analytics/use-analytics-section';
import { useOffline } from '../features/offline/offline-context';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { resolveAvailableSelection } from '../features/tenants/organization-selection-storage';

export function AssetHistoryPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    params.get('tenantId')
  );
  const filters = analyticsFilters(readDashboardFilters(params));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const history = useAnalyticsSection(
    mode === 'REMOTE' && !!tenantId && !!id,
    (signal) => analyticsApi.assetHistory(tenantId, id, filters, signal, page),
    [tenantId, id, JSON.stringify(filters), page]
  );
  const backParams = new URLSearchParams(params);
  backParams.delete('page');

  function setPage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  }

  return (
    <>
      <PageHeader
        title="Historial del activo"
        description="Inspecciones y hallazgos del activo, incluidos los registrados dentro de un trabajo del activo padre."
      />
      <Link
        to={`/dashboard?${backParams.toString()}`}
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Volver al dashboard
      </Link>
      {mode !== 'REMOTE' ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          El historial analítico requiere conexión al servidor.
        </p>
      ) : history.loading || access.isLoading ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Cargando historial…
        </p>
      ) : history.error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {history.error}
        </p>
      ) : history.data ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {history.data.asset.assetType}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {history.data.asset.name}
            </h2>
            <p className="text-sm text-slate-500">
              {history.data.asset.code} · {history.data.asset.path}
            </p>
            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <p>
                <strong className="block text-2xl text-slate-950">
                  {history.data.summary.works}
                </strong>
                <span className="text-sm text-slate-500">Trabajos</span>
              </p>
              <p>
                <strong className="block text-2xl text-slate-950">
                  {history.data.summary.findings}
                </strong>
                <span className="text-sm text-slate-500">Hallazgos</span>
              </p>
              <p>
                <strong className="block text-base text-slate-950">
                  {history.data.summary.lastInspectionAt ?? '—'}
                </strong>
                <span className="text-sm text-slate-500">
                  Última inspección
                </span>
              </p>
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Trabajos</h2>
              {history.data.works.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {history.data.works.map((work) => (
                    <li key={work.id} className="py-3">
                      <Link
                        className="font-medium text-slate-900 hover:underline"
                        to={`/works/${encodeURIComponent(
                          work.id
                        )}?tenantId=${encodeURIComponent(tenantId)}`}
                      >
                        {work.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {work.executionDate} · {work.status}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Sin trabajos en este período.
                </p>
              )}
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Hallazgos</h2>
              {history.data.findings.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {history.data.findings.map((finding) => (
                    <li key={finding.id} className="py-3">
                      <p className="font-medium text-slate-900">
                        {finding.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {finding.severityName} · {finding.workDate}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Sin hallazgos en este período.
                </p>
              )}
            </section>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Mediciones disponibles</h2>
            {history.data.analogConcepts.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {history.data.analogConcepts.map((concept) => (
                  <li
                    key={concept.conceptId}
                    className="rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    {concept.name} · {concept.measurements} mediciones
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Sin mediciones analógicas para este activo.
              </p>
            )}
          </section>
          {(history.data.summary.works > history.data.pageSize ||
            history.data.summary.findings > history.data.pageSize) && (
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Anterior
              </button>
              <span>Página {page}</span>
              <button
                type="button"
                disabled={
                  page * history.data.pageSize >=
                  Math.max(
                    history.data.summary.works,
                    history.data.summary.findings
                  )
                }
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
