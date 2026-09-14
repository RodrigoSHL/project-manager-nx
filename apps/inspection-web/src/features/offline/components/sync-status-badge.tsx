import type { Work } from '../../works/models';
import type { LocalSyncStatus } from '../models';

const labels: Record<LocalSyncStatus, string> = {
  SYNCED: 'Sincronizado',
  LOCAL_ONLY: 'Solo local',
  MODIFIED: 'Modificado localmente',
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
          ? 'bg-blue-50 text-blue-700'
          : 'bg-amber-50 text-amber-800'
      }`}
    >
      {labels[status]}
    </span>
  );
}
