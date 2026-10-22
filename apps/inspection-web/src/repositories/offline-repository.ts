import { inspectionDb } from '../db/inspection-db';
import type {
  PendingChangeItem,
  PendingSyncSummary,
} from '../features/offline/models';

export const offlineRepository = {
  listSites: (tenantId?: string) =>
    tenantId
      ? inspectionDb.offlineSites.where('tenantId').equals(tenantId).toArray()
      : inspectionDb.offlineSites.toArray(),
  async getSyncMetadata(tenantId?: string) {
    const [checkpoints, conflicts] = await Promise.all([
      tenantId
        ? inspectionDb.syncCheckpoints
            .where('tenantId')
            .equals(tenantId)
            .toArray()
        : inspectionDb.syncCheckpoints.toArray(),
      tenantId
        ? inspectionDb.syncConflictCandidates
            .where('[tenantId+status]')
            .equals([tenantId, 'PENDING'])
            .count()
        : inspectionDb.syncConflictCandidates
            .filter((item) => item.status === 'PENDING')
            .count(),
    ]);
    const latest = checkpoints.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )[0];
    return {
      checkpoint: checkpoints.reduce(
        (highest, item) => Math.max(highest, item.checkpoint),
        0
      ),
      lastSyncAt: latest?.updatedAt,
      conflicts,
    };
  },
  async clear() {
    await inspectionDb.delete();
    await inspectionDb.open();
  },
  async getStats(tenantId: string) {
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
      inspectionDb.assets.where('tenantId').equals(tenantId).count(),
      inspectionDb.works.where('tenantId').equals(tenantId).count(),
      inspectionDb.formTemplates.where('tenantId').equals(tenantId).count(),
      inspectionDb.conceptResponses.where('tenantId').equals(tenantId).count(),
      inspectionDb.works
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'LOCAL_ONLY'])
        .count(),
      inspectionDb.works
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'MODIFIED'])
        .count(),
      inspectionDb.conceptResponses
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'LOCAL_ONLY'])
        .count(),
      inspectionDb.conceptResponses
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'MODIFIED'])
        .count(),
      inspectionDb.annotations
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'LOCAL_ONLY'])
        .count(),
      inspectionDb.annotations
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'MODIFIED'])
        .count(),
      inspectionDb.taskCompletions
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'LOCAL_ONLY'])
        .count(),
      inspectionDb.taskCompletions
        .where('[tenantId+syncStatus]')
        .equals([tenantId, 'MODIFIED'])
        .count(),
      inspectionDb.fileReferences.where('tenantId').equals(tenantId).count(),
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
  async getPendingSummary(tenantId?: string): Promise<PendingSyncSummary> {
    const [outbox, snapshots, photos] = await Promise.all([
      (tenantId
        ? inspectionDb.outbox.where('tenantId').equals(tenantId)
        : inspectionDb.outbox.toCollection()
      )
        .filter(
          (item) =>
            item.status === 'PENDING' ||
            item.status === 'SENDING' ||
            item.status === 'ERROR'
        )
        .toArray(),
      tenantId
        ? inspectionDb.snapshots.where('tenantId').equals(tenantId).toArray()
        : inspectionDb.snapshots.toArray(),
      (tenantId
        ? inspectionDb.fileReferences.where('tenantId').equals(tenantId)
        : inspectionDb.fileReferences.toCollection()
      )
        .filter((item) => item.status !== 'REMOTE_ONLY')
        .toArray(),
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
    const items: PendingChangeItem[] = [
      ...outbox.map((item) => {
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
      }),
      ...photos.map(
        (photo): PendingChangeItem => ({
          id: photo.id,
          tenantId: photo.tenantId,
          workId: photo.workId,
          kind: 'PHOTO',
          label: photo.originalName,
          syncStatus: 'LOCAL_ONLY',
          updatedAt: photo.updatedAt ?? photo.createdAt ?? '',
          operation: 'CREATE',
          status:
            photo.status === 'ERROR'
              ? 'ERROR'
              : photo.status === 'PENDING_UPLOAD'
              ? 'SENDING'
              : 'PENDING',
          attempts: photo.attempts ?? 0,
          lastError: photo.lastError,
        })
      ),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
      photos: photos.length,
      items,
    };
  },
};

function workItemKey(tenantId: string, workId: string, formItemId: string) {
  return `${tenantId}:${workId}:${formItemId}`;
}
