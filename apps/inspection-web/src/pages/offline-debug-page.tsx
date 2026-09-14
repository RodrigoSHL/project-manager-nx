import { useEffect, useState } from 'react';
import { Database, HardDrive, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { useOffline } from '../features/offline/offline-context';
import { offlineRepository } from '../repositories/offline-repository';

type Counts = {
  assets: number;
  works: number;
  templates: number;
  responses: number;
  localOnly: number;
  modified: number;
  files: number;
};

export function OfflineDebugPage() {
  const offline = useOffline();
  const emptyCounts = {
    assets: 0,
    works: 0,
    templates: 0,
    responses: 0,
    localOnly: 0,
    modified: 0,
    files: 0,
  };
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [usage, setUsage] = useState<string>('No disponible');
  useEffect(() => {
    void offlineRepository.getStats().then(setCounts);
    void navigator.storage
      ?.estimate()
      .then((value) => setUsage(formatBytes(value.usage ?? 0)));
  }, [offline.offlineSites]);

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
        <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {offline.offlineSites.length ? (
            offline.offlineSites.map((item) => (
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
              Todavía no hay sitios descargados.
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
