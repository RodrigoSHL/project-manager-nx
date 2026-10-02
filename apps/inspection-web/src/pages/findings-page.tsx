import { Link, useSearchParams } from 'react-router-dom';
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

export function FindingsPage() {
  const [params, setParams] = useSearchParams();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    params.get('tenantId')
  );
  const filters = analyticsFilters(readDashboardFilters(params));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const section = useAnalyticsSection(
    mode === 'REMOTE' && !!tenantId,
    (signal) => analyticsApi.findings(tenantId, filters, signal, page),
    [tenantId, JSON.stringify(filters), page]
  );
  const dashboardSearch = new URLSearchParams(params);
  dashboardSearch.delete('page');

  function setPage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  }

  return (
    <>
      <PageHeader
        title="Hallazgos"
        description="Hallazgos confirmados para la empresa y los filtros seleccionados en el dashboard."
      />
      <Link
        to={`/dashboard?${dashboardSearch.toString()}`}
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Volver al dashboard
      </Link>
      {mode !== 'REMOTE' ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Este resumen requiere conexión al servidor.
        </p>
      ) : section.loading || access.isLoading ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Cargando hallazgos…
        </p>
      ) : section.error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {section.error}
        </p>
      ) : !section.data || section.data.total === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No hay hallazgos confirmados para este período.
        </p>
      ) : (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-950">
            {section.data.total.toLocaleString('es-CL')} hallazgos
          </h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {section.data.items.map((finding) => {
              const destination = new URLSearchParams(dashboardSearch);
              destination.set('tenantId', tenantId);
              return (
                <li key={finding.id} className="py-4">
                  <Link
                    to={`/assets/${encodeURIComponent(
                      finding.assetId
                    )}/history?${destination.toString()}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {finding.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {finding.assetName} · {finding.severityName} ·{' '}
                    {finding.workDate}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex items-center gap-3 text-sm">
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
              disabled={page * section.data.pageSize >= section.data.total}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}
    </>
  );
}
