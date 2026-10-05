import { useEffect, useState } from 'react';
import { Database, HardDrive, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { useOffline } from '../features/offline/offline-context';
import { offlineRepository } from '../repositories/offline-repository';
import { useConnectivity } from '../hooks/use-connectivity';
import { useAuth } from '../features/auth/auth-context';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../features/tenants/organization-selection-storage';

type Counts = {
  assets: number;
  works: number;
  templates: number;
  responses: number;
  localOnly: number;
  modified: number;
  files: number;
};

const emptyCounts: Counts = {
  assets: 0,
  works: 0,
  templates: 0,
  responses: 0,
  localOnly: 0,
  modified: 0,
  files: 0,
};

export function OfflineDebugPage() {
  const offline = useOffline();
  const connectivity = useConnectivity();
  const auth = useAuth();
  const tenantAccess = useTenantAccess();
  const userId = auth.user?.userId ?? '';
  const [tenantId, setTenantId] = useState('');
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [usage, setUsage] = useState<string>('No disponible');

  useEffect(() => {
    setTenantId((current) =>
      resolveAvailableSelection(
        tenantAccess.accessibleTenants,
        current,
        organizationSelectionStorage.getTenantId(userId)
      )
    );
  }, [tenantAccess.accessibleTenants, userId]);

  useEffect(() => {
    if (!tenantId) {
      setCounts(emptyCounts);
      return;
    }
    let active = true;
    setCounts(emptyCounts);
    void offlineRepository.getStats(tenantId).then((stats) => {
      if (active) setCounts(stats);
    });
    return () => {
      active = false;
    };
  }, [tenantId, offline.offlineSites, offline.pendingSummary]);

  useEffect(() => {
    void navigator.storage
      ?.estimate()
      .then((value) => setUsage(formatBytes(value.usage ?? 0)));
  }, []);

  const downloadedSites = offline.offlineSites.filter(
    (item) => item.tenantId === tenantId
  );

  function handleTenantChange(nextTenantId: string) {
    organizationSelectionStorage.rememberTenant(userId, nextTenantId);
    setTenantId(nextTenantId);
  }

  async function clear() {
    if (
      !window.confirm(
        '¿Eliminar toda la copia local de GridAssets en este navegador?'
      )
    )
      return;
    await offline.clearLocalData();
    setCounts(emptyCounts);
  }

  return (
    <>
      <PageHeader
        title="Almacenamiento local"
        description="Diagnóstico del contenido guardado en IndexedDB para trabajo sin conexión."
      />
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          Tenant / Empresa
          <select
            value={tenantId}
            onChange={(event) => handleTenantChange(event.target.value)}
            className="mt-2 block h-11 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 text-slate-900"
          >
            {tenantAccess.accessibleTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Activos" value={counts.assets} />
        <Metric label="Trabajos" value={counts.works} />
        <Metric label="Respuestas" value={counts.responses} />
        <Metric label="Plantillas" value={counts.templates} />
        <Metric label="Solo locales" value={counts.localOnly} />
        <Metric label="Modificados" value={counts.modified} />
        <Metric label="Archivos referenciados" value={counts.files} />
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Database className="size-5" /> Sitios descargados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Uso aproximado del navegador: {usage}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={offline.mode === 'REMOTE' ? 'default' : 'outline'}
              disabled={!connectivity.apiReachable}
              onClick={() => offline.setMode('REMOTE')}
            >
              Datos remotos
            </Button>
            <Button
              variant={offline.mode === 'LOCAL' ? 'default' : 'outline'}
              disabled={
                !offline.offlineSites.some((item) => item.status === 'READY')
              }
              onClick={() => offline.setMode('LOCAL')}
            >
              Datos locales
            </Button>
          </div>
        </div>
        {!connectivity.apiReachable ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            La copia local se usa automáticamente mientras el servidor no está
            disponible.
          </p>
        ) : null}
        <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {downloadedSites.length ? (
            downloadedSites.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap justify-between gap-2 p-3 text-sm"
              >
                <span className="font-medium">
                  {item.tenantName ?? item.tenantId} ·{' '}
                  {item.siteName ?? item.siteId}
                </span>
                <span className="text-slate-500">
                  {item.status}
                  {item.downloadedAt
                    ? ` · ${new Date(item.downloadedAt).toLocaleString(
                        'es-CL'
                      )}`
                    : ''}
                </span>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-500">
              No hay sitios descargados para esta empresa.
            </p>
          )}
        </div>
        <Button className="mt-5" variant="outline" onClick={() => void clear()}>
          <Trash2 className="size-4" /> Limpiar datos locales
        </Button>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <HardDrive className="size-4 text-slate-400" />
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
function formatBytes(value: number) {
  return value < 1024 * 1024
    ? `${(value / 1024).toFixed(1)} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;
}
