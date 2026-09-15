import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  FilePenLine,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  ServerOff,
} from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { useConnectivity } from '../hooks/use-connectivity';
import { useOffline } from '../features/offline/offline-context';
import type { PendingChangeKind } from '../features/offline/models';

const kindLabels: Record<PendingChangeKind, string> = {
  WORK: 'Trabajo',
  RESPONSE: 'Respuesta',
  TASK_COMPLETION: 'Tarea',
  ANNOTATION: 'Comentario',
};

export function SyncPage() {
  const connectivity = useConnectivity();
  const {
    pendingSummary,
    refresh,
    synchronize,
    isSyncing,
    syncProgress,
    lastSyncSummary,
    syncError,
  } = useOffline();
  const connection = !connectivity.browserOnline
    ? {
        Icon: CloudOff,
        title: 'Modo sin conexión',
        detail: 'La red del dispositivo no está disponible.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      }
    : connectivity.apiReachable
    ? {
        Icon: Cloud,
        title: 'En línea',
        detail: 'El servidor responde correctamente.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      }
    : {
        Icon: ServerOff,
        title: 'Servidor no disponible',
        detail: 'Hay red, pero GridAssets no responde.',
        color: 'text-red-700 bg-red-50 border-red-200',
      };

  return (
    <>
      <PageHeader
        title="Sincronización"
        description="Revisa lo que quedó guardado en este dispositivo antes de enviarlo al servidor."
      />

      <section
        className={`flex items-start gap-3 rounded-xl border p-4 ${connection.color}`}
      >
        <connection.Icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">{connection.title}</h2>
          <p className="mt-1 text-sm opacity-80">{connection.detail}</p>
          {!connectivity.apiReachable ? (
            <p className="mt-2 text-sm font-medium">
              Puedes seguir trabajando; los cambios se guardarán localmente.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          icon={RefreshCw}
          label="Cambios pendientes"
          value={pendingSummary.total}
        />
        <Metric
          icon={FilePenLine}
          label="Trabajos nuevos"
          value={pendingSummary.newWorks}
        />
        <Metric
          icon={FilePenLine}
          label="Registros solo locales"
          value={pendingSummary.localOnly}
        />
        <Metric
          icon={FilePenLine}
          label="Registros modificados"
          value={pendingSummary.modified}
        />
        <Metric
          icon={ListChecks}
          label="Respuestas y tareas"
          value={pendingSummary.responses + pendingSummary.taskCompletions}
        />
        <Metric
          icon={MessageSquareText}
          label="Comentarios"
          value={pendingSummary.annotations}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Registros pendientes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Este listado se calcula directamente desde IndexedDB.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
          >
            <RefreshCw className="size-4" /> Actualizar conteo
          </Button>
        </div>

        <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {pendingSummary.items.length ? (
            pendingSummary.items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {kindLabels[item.kind]} ·{' '}
                    {new Date(item.updatedAt).toLocaleString('es-CL')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === 'ERROR'
                      ? 'bg-red-50 text-red-700'
                      : item.status === 'SENDING'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {item.status === 'ERROR'
                    ? `Error · intento ${item.attempts}`
                    : item.status === 'SENDING'
                    ? 'Enviando'
                    : item.operation === 'CREATE'
                    ? 'Nuevo'
                    : item.operation === 'DELETE'
                    ? 'Eliminar'
                    : 'Modificado'}
                </span>
                {item.lastError ? (
                  <p className="w-full text-xs text-red-600">
                    {item.lastError}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              No hay cambios locales pendientes.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <Button
            type="button"
            disabled={
              !connectivity.apiReachable ||
              pendingSummary.total === 0 ||
              isSyncing
            }
            onClick={() => void synchronize()}
          >
            {isSyncing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}{' '}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Button>
          {isSyncing && syncProgress ? (
            <div className="mt-3" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>Enviando cambios</span>
                <span>
                  {syncProgress.processed} / {syncProgress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${
                      syncProgress.total
                        ? (syncProgress.processed / syncProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : null}
          {lastSyncSummary ? (
            <div
              className="mt-3 flex flex-wrap gap-4 text-sm"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                {lastSyncSummary.synced} sincronizados
              </span>
              {lastSyncSummary.failed > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle className="size-4" />
                  {lastSyncSummary.failed} con error
                </span>
              ) : null}
            </div>
          ) : null}
          {syncError ? (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {syncError}
            </p>
          ) : null}
          {!connectivity.apiReachable ? (
            <p className="mt-2 text-sm text-slate-600">
              El botón se habilitará cuando la API vuelva a estar disponible.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof RefreshCw;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="size-4 text-slate-400" />
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
