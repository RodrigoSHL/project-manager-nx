import type { Work } from '../../works/models';
import type { LocalSyncStatus } from '../models';

const labels: Record<LocalSyncStatus, string> = {
  SYNCED: 'Copia local actual',
  LOCAL_ONLY: 'Pendiente de sincronización',
  MODIFIED: 'Cambios pendientes',
};

export function SyncStatusBadge({ work }: { work: Work }) {
  const status = (work as Work & { syncStatus?: LocalSyncStatus }).syncStatus;
  if (!status) return null;
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        status === 'SYNCED'
          ? 'bg-emerald-50 text-emerald-700'
          : status === 'LOCAL_ONLY'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-amber-50 text-amber-800'
      }`}
    >
      {labels[status]}
    </span>
  );
}
