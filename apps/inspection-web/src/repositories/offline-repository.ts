import { inspectionDb } from '../db/inspection-db';
import type {
  LocalSyncStatus,
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
    const [works, responses, tasks, annotations, snapshots] =
      await Promise.all([
        inspectionDb.works
          .filter((item) => item.syncStatus !== 'SYNCED')
          .toArray(),
        inspectionDb.conceptResponses
          .filter((item) => item.syncStatus !== 'SYNCED')
          .toArray(),
        inspectionDb.taskCompletions
          .filter((item) => item.syncStatus !== 'SYNCED')
          .toArray(),
        inspectionDb.annotations
          .filter((item) => item.syncStatus !== 'SYNCED')
          .toArray(),
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
    const statuses: LocalSyncStatus[] = [
      ...works.map((item) => item.syncStatus),
      ...responses.map((item) => item.syncStatus),
      ...tasks.map((item) => item.syncStatus),
      ...annotations.map((item) => item.syncStatus),
    ];
    const items: PendingChangeItem[] = [
      ...works.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        workId: item.id,
        kind: 'WORK' as const,
        label: item.title,
        syncStatus: asPendingStatus(item.syncStatus),
        updatedAt: item.updatedAt,
      })),
      ...responses.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        workId: item.workId,
        kind: 'RESPONSE' as const,
        label:
          itemLabels.get(
            workItemKey(item.tenantId, item.workId, item.formItemId)
          ) ??
          'Concepto del formulario',
        syncStatus: asPendingStatus(item.syncStatus),
        updatedAt: item.updatedAt,
      })),
      ...tasks.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        workId: item.workId,
        kind: 'TASK_COMPLETION' as const,
        label:
          itemLabels.get(
            workItemKey(item.tenantId, item.workId, item.formItemId)
          ) ??
          'Tarea del formulario',
        syncStatus: asPendingStatus(item.syncStatus),
        updatedAt: item.updatedAt,
      })),
      ...annotations.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        workId: item.workId,
        kind: 'ANNOTATION' as const,
        label: item.comment,
        syncStatus: asPendingStatus(item.syncStatus),
        updatedAt: item.updatedAt,
      })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      total: statuses.length,
      localOnly: statuses.filter((status) => status === 'LOCAL_ONLY').length,
      modified: statuses.filter((status) => status === 'MODIFIED').length,
      newWorks: works.filter((item) => item.syncStatus === 'LOCAL_ONLY').length,
      modifiedWorks: works.filter((item) => item.syncStatus === 'MODIFIED')
        .length,
      responses: responses.length,
      taskCompletions: tasks.length,
      annotations: annotations.length,
      items,
    };
  },
};

function asPendingStatus(status: LocalSyncStatus) {
  if (status === 'SYNCED') {
    throw new Error('Un registro sincronizado no es un cambio pendiente.');
  }
  return status;
}

function workItemKey(tenantId: string, workId: string, formItemId: string) {
  return `${tenantId}:${workId}:${formItemId}`;
}
