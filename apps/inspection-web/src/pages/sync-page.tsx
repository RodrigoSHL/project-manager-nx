import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Cloud,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { useConnectivity } from '../hooks/use-connectivity';
import { useOffline } from '../features/offline/offline-context';
import type {
  PendingChangeItem,
  PendingSyncSummary,
} from '../features/offline/models';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { useAuth } from '../features/auth/auth-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../features/tenants/organization-selection-storage';
import { offlineRepository } from '../repositories/offline-repository';
import { connectionPresentation } from '../features/connectivity/connectivity-presentation';
import { connectivityAppearances } from '../features/offline/components/connectivity-appearance';
import { AnalyticsIcon } from '../features/analytics/components/analytics-icon';

const kindLabels: Record<PendingChangeItem['kind'], string> = {
  WORK: 'Trabajo',
  RESPONSE: 'Respuesta',
  TASK_COMPLETION: 'Tarea',
  ANNOTATION: 'Comentario',
  PHOTO: 'Fotografía',
};

const emptyPendingSummary: PendingSyncSummary = {
  total: 0,
  localOnly: 0,
  modified: 0,
  newWorks: 0,
  modifiedWorks: 0,
  responses: 0,
  taskCompletions: 0,
  annotations: 0,
  photos: 0,
  items: [],
};

const emptySyncMetadata = {
  checkpoint: 0,
  lastSyncAt: undefined as string | undefined,
  conflicts: 0,
};

export function SyncPage() {
  const connectivity = useConnectivity();
  const auth = useAuth();
  const tenantAccess = useTenantAccess();
  const {
    refresh: refreshGlobalState,
    synchronize,
    isSyncing,
    syncTenantId,
    syncProgress,
    lastSyncSummary,
    syncError,
    hasLegacyLocalData,
  } = useOffline();
  const userId = auth.user?.userId ?? '';
  const [tenantId, setTenantId] = useState('');
  const [pendingSummary, setPendingSummary] = useState(emptyPendingSummary);
  const [syncMetadata, setSyncMetadata] = useState(emptySyncMetadata);
  const selectedTenant = tenantAccess.accessibleTenants.find(
    (tenant) => tenant.id === tenantId
  );
  const showSyncFeedback = syncTenantId === tenantId;

  useEffect(() => {
    setTenantId((current) =>
      resolveAvailableSelection(
        tenantAccess.accessibleTenants,
        current,
        organizationSelectionStorage.getTenantId(userId)
      )
    );
  }, [tenantAccess.accessibleTenants, userId]);

  const refreshTenantState = useCallback(async () => {
    if (!tenantId) {
      setPendingSummary(emptyPendingSummary);
      setSyncMetadata(emptySyncMetadata);
      return;
    }
    const [pending, metadata] = await Promise.all([
      offlineRepository.getPendingSummary(tenantId),
      offlineRepository.getSyncMetadata(tenantId),
    ]);
    setPendingSummary(pending);
    setSyncMetadata(metadata);
  }, [tenantId]);

  useEffect(() => {
    void refreshTenantState();
  }, [refreshTenantState]);

  function handleTenantChange(nextTenantId: string) {
    organizationSelectionStorage.rememberTenant(userId, nextTenantId);
    setTenantId(nextTenantId);
  }

  async function refreshAll() {
    await Promise.all([refreshGlobalState(), refreshTenantState()]);
  }

  async function synchronizeTenant() {
    if (!tenantId) return;
    await synchronize(tenantId);
    await refreshTenantState();
  }

  const presentation = connectionPresentation(connectivity);
  const connection = {
    ...presentation,
    ...connectivityAppearances[presentation.status],
  };

  return (
    <>
      <PageHeader
        title="Sincronización"
        description="Envía y descarga cambios únicamente para la empresa seleccionada."
      />

      {hasLegacyLocalData ? (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/20 dark:bg-amber-400/10"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Los datos offline de una versión anterior están conservados, pero no
            pueden asociarse automáticamente a esta cuenta. Si tenías cambios
            pendientes, solicita su recuperación antes de borrar los datos del
            navegador.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Empresa
          <span className="relative mt-2 block">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <select
              value={tenantId}
              onChange={(event) => handleTenantChange(event.target.value)}
              disabled={tenantAccess.isLoading || isSyncing}
              className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-300/15"
            >
              {tenantAccess.accessibleTenants.length === 0 ? (
                <option value="">No hay empresas disponibles</option>
              ) : null}
              {tenantAccess.accessibleTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </span>
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Los conteos, conflictos, checkpoint y registros mostrados pertenecen
          solamente a {selectedTenant?.name ?? 'la empresa seleccionada'}.
        </p>
      </section>

      <section
        className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${connection.className}`}
      >
        <connection.Icon
          className={`mt-0.5 size-5 shrink-0 ${
            connection.status === 'checking' ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{connection.label}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {connection.detail}
          </p>
          {!connectivity.apiReachable && connection.status !== 'checking' ? (
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              La sincronización se habilitará al recuperar la conexión.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={RefreshCw}
          label="Cambios pendientes"
          value={pendingSummary.total}
        />
        <Metric
          icon={RefreshCw}
          label="Checkpoint"
          value={syncMetadata.checkpoint}
        />
        <Metric
          icon={AlertTriangle}
          label="Conflictos detectados"
          value={syncMetadata.conflicts}
        />
        <Metric
          icon={Cloud}
          label="Última sincronización"
          value={
            syncMetadata.lastSyncAt
              ? new Date(syncMetadata.lastSyncAt).toLocaleDateString('es-CL')
              : '—'
          }
          detail={
            syncMetadata.lastSyncAt
              ? new Date(syncMetadata.lastSyncAt).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : undefined
          }
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
        <Metric
          icon={Cloud}
          label="Fotografías"
          value={pendingSummary.photos}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-slate-100">
              Registros pendientes
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Este listado se calcula directamente desde IndexedDB.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshAll()}
          >
            <RefreshCw className="size-4" /> Actualizar conteo
          </Button>
        </div>

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800">
          {pendingSummary.items.length ? (
            pendingSummary.items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {kindLabels[item.kind]} ·{' '}
                    {new Date(item.updatedAt).toLocaleString('es-CL')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === 'ERROR'
                      ? 'bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-200'
                      : item.status === 'SENDING'
                      ? 'bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-200'
                      : 'bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200'
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
                  <p className="w-full text-xs text-red-600 dark:text-red-300">
                    {item.lastError}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay cambios locales pendientes.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 dark:bg-slate-950 p-4">
          <Button
            type="button"
            disabled={!tenantId || !connectivity.apiReachable || isSyncing}
            onClick={() => void synchronizeTenant()}
          >
            {isSyncing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}{' '}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Button>
          {isSyncing && showSyncFeedback && syncProgress ? (
            <div className="mt-3" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>{progressLabel(syncProgress.phase)}</span>
                <span>
                  {syncProgress.processed} / {syncProgress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-slate-900 dark:bg-slate-200 transition-all"
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
          {showSyncFeedback && lastSyncSummary ? (
            <div
              className="mt-3 flex flex-wrap gap-4 text-sm"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                {lastSyncSummary.pushed} enviados
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                {lastSyncSummary.pulled} recibidos
              </span>
              {lastSyncSummary.conflicts > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-4" />
                  {lastSyncSummary.conflicts} conflictos pendientes
                </span>
              ) : null}
              {lastSyncSummary.errors > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-red-700 dark:text-red-300">
                  <AlertTriangle className="size-4" />
                  {lastSyncSummary.errors} con error
                </span>
              ) : null}
            </div>
          ) : null}
          {showSyncFeedback && syncError ? (
            <p
              className="mt-3 text-sm font-medium text-red-700 dark:text-red-300"
              role="alert"
            >
              {syncError}
            </p>
          ) : null}
          {!connectivity.apiReachable ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
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
  detail,
}: {
  icon: typeof RefreshCw;
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div className="min-h-36 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-h-10 items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </p>
        <span className="hidden sm:block">
          <AnalyticsIcon icon={Icon} />
        </span>
      </div>
      <p
        className={`mt-3 min-h-8 break-words font-semibold text-slate-950 dark:text-slate-100 ${
          typeof value === 'string' && value !== '—'
            ? 'text-base leading-6'
            : 'text-2xl leading-8'
        }`}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function progressLabel(phase: 'CHECKING' | 'PUSHING' | 'PULLING' | 'APPLYING') {
  if (phase === 'CHECKING') return 'Comprobando API...';
  if (phase === 'PUSHING') return 'Enviando cambios locales...';
  if (phase === 'PULLING') return 'Descargando cambios...';
  return 'Aplicando cambios...';
}
