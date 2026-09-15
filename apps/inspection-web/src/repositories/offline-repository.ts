import { inspectionDb } from '../db/inspection-db';
import type {
  PendingChangeItem,
  PendingSyncSummary,
} from '../features/offline/models';

export const offlineRepository = {
  listSites: () => inspectionDb.offlineSites.toArray(),
  async clear() {
    await inspectionDb.delete();
    await inspectionDb.open();
  },
  async getStats() {
    const [
      assets,
      works,
      templates,
      responses,
      localOnlyWorks,
      modifiedWorks,
      localOnlyResponses,
      modifiedResponses,
      localOnlyAnnotations,
      modifiedAnnotations,
      localOnlyTasks,
      modifiedTasks,
      files,
    ] = await Promise.all([
      inspectionDb.assets.count(),
      inspectionDb.works.count(),
      inspectionDb.formTemplates.count(),
      inspectionDb.conceptResponses.count(),
      inspectionDb.works
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.works
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.conceptResponses
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.conceptResponses
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.annotations
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.annotations
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.taskCompletions
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.taskCompletions
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.fileReferences.count(),
    ]);
    return {
      assets,
      works,
      templates,
      responses,
      localOnly:
        localOnlyWorks +
        localOnlyResponses +
        localOnlyAnnotations +
        localOnlyTasks,
      modified:
        modifiedWorks + modifiedResponses + modifiedAnnotations + modifiedTasks,
      files,
    };
  },
  async getPendingSummary(): Promise<PendingSyncSummary> {
    const [outbox, snapshots] = await Promise.all([
      inspectionDb.outbox.filter((item) => item.status !== 'SYNCED').toArray(),
      inspectionDb.snapshots.toArray(),
    ]);
    const itemLabels = new Map(
      snapshots.flatMap((snapshot) =>
        snapshot.sections.flatMap((section) =>
          section.items.map((item) => [
            workItemKey(snapshot.tenantId, snapshot.workId, item.id),
            item.title?.trim() ||
              item.concept?.name.trim() ||
              (item.type === 'TASK'
                ? 'Tarea sin nombre'
                : 'Concepto sin nombre'),
          ])
        )
      )
    );
    const items: PendingChangeItem[] = outbox
      .map((item) => {
        const payload = item.payload;
        const workId =
          item.entityType === 'WORK'
            ? item.entityId
            : String(payload.workId ?? '');
        const formItemId = String(payload.formItemId ?? '');
        const fallback =
          item.entityType === 'RESPONSE'
            ? 'Concepto del formulario'
            : item.entityType === 'TASK_COMPLETION'
            ? 'Tarea del formulario'
            : item.entityType === 'ANNOTATION'
            ? String(payload.comment ?? 'Comentario')
            : String(payload.title ?? 'Trabajo');
        return {
          id: item.id,
          tenantId: item.tenantId,
          workId,
          kind: item.entityType,
          label:
            item.entityType === 'WORK'
              ? fallback
              : itemLabels.get(
                  workItemKey(item.tenantId, workId, formItemId)
                ) ?? fallback,
          syncStatus:
            item.operation === 'CREATE'
              ? ('LOCAL_ONLY' as const)
              : ('MODIFIED' as const),
          updatedAt: item.updatedAt,
          operation: item.operation,
          status: item.status as Exclude<typeof item.status, 'SYNCED'>,
          attempts: item.attempts,
          lastError: item.lastError,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      total: items.length,
      localOnly: items.filter((item) => item.operation === 'CREATE').length,
      modified: items.filter((item) => item.operation !== 'CREATE').length,
      newWorks: items.filter(
        (item) => item.kind === 'WORK' && item.operation === 'CREATE'
      ).length,
      modifiedWorks: items.filter(
        (item) => item.kind === 'WORK' && item.operation !== 'CREATE'
      ).length,
      responses: items.filter((item) => item.kind === 'RESPONSE').length,
      taskCompletions: items.filter((item) => item.kind === 'TASK_COMPLETION')
        .length,
      annotations: items.filter((item) => item.kind === 'ANNOTATION').length,
      items,
    };
  },
};

function workItemKey(tenantId: string, workId: string, formItemId: string) {
  return `${tenantId}:${workId}:${formItemId}`;
}
