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

export function MeasurementAnalyticsPage() {
  const [params] = useSearchParams();
  const access = useTenantAccess();
  const { mode } = useOffline();
  const tenantId = resolveAvailableSelection(
    access.accessibleTenants,
    params.get('tenantId')
  );
  const filters = analyticsFilters(readDashboardFilters(params));
  const concepts = useAnalyticsSection(
    mode === 'REMOTE' && !!tenantId,
    (signal) => analyticsApi.concepts(tenantId, filters, signal),
    [tenantId, JSON.stringify(filters)]
  );
  const selected = concepts.data?.find(
    (item) => item.id === params.get('conceptId')
  );
  const backParams = new URLSearchParams(params);
  backParams.delete('conceptId');
  return (
    <>
      <PageHeader
        title="Análisis de mediciones"
        description="El comparador técnico de mediciones se implementará en la fase 4."
      />
      <Link
        to={`/dashboard?${backParams.toString()}`}
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Volver al dashboard
      </Link>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode !== 'REMOTE' ? (
          <p className="text-sm text-slate-600">
            Conéctate para consultar las mediciones históricas.
          </p>
        ) : concepts.loading || access.isLoading ? (
          <p className="text-sm text-slate-600">Cargando concepto…</p>
        ) : concepts.error ? (
          <p role="alert" className="text-sm text-red-700">
            {concepts.error}
          </p>
        ) : selected ? (
          <>
            <h2 className="text-lg font-semibold text-slate-950">
              {selected.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {selected.measurementCount.toLocaleString('es-CL')} mediciones
              disponibles para el período seleccionado. Aquí aparecerá el
              comparador por activo, con límites históricos y detalle de cada
              punto.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Selecciona un concepto con historial desde el dashboard.
          </p>
        )}
      </section>
    </>
  );
}
