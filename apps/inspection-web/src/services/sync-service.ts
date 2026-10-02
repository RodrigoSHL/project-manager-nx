import { inspectionDb, syncCheckpointKey } from '../db/inspection-db';
import { pullSyncBatch, pushSyncBatch } from '../features/offline/sync-api';
import type {
  OutboxItem,
  PendingChangeKind,
  SyncProgress,
  SyncSummary,
} from '../features/offline/models';
import { outboxRepository } from '../repositories/outbox-repository';
import { applyRemoteChanges } from './apply-remote-changes';
import { checkApiReachability } from './connectivity-service';

export const SYNC_BATCH_SIZE = 50;

type PushSummary = { total: number; synced: number; failed: number };

export class SyncService {
  async pushPendingChanges(
    tenantId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<PushSummary> {
    await this.recoverInterruptedChanges(tenantId);
    const pending = await outboxRepository.listRetryable(tenantId);
    const total = pending.length;
    let processed = 0;
    let synced = 0;
    let failed = 0;
    onProgress?.({ phase: 'PUSHING', processed, total });
    if (total === 0) return { total, synced, failed };

    const deviceId = await outboxRepository.getDeviceId();
    for (const batch of this.createBatches(pending)) {
      await this.markSending(batch);
      try {
        const results = await pushSyncBatch(batch[0].tenantId, deviceId, batch);
        const resultById = new Map(
          results.map((result) => [result.outboxId, result])
        );
        for (const item of batch) {
          const result = resultById.get(item.id);
          if (result?.success) {
            await this.markAcknowledged(item);
            synced += 1;
          } else {
            await this.markError(
              item,
              result?.error || 'El servidor no respondió por este cambio.'
            );
            failed += 1;
          }
          processed += 1;
          onProgress?.({ phase: 'PUSHING', processed, total });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error de sincronización';
        for (const item of batch) {
          await this.markError(item, message);
          failed += 1;
          processed += 1;
          onProgress?.({ phase: 'PUSHING', processed, total });
        }
        break;
      }
    }
    return { total, synced, failed };
  }

  async sync(
    tenantId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncSummary> {
    onProgress?.({ phase: 'CHECKING', processed: 0, total: 0 });
    if (!(await checkApiReachability())) {
      throw new Error('La API no está disponible para sincronizar.');
    }

    const readySites = await inspectionDb.offlineSites
      .where('[tenantId+status]')
      .equals([tenantId, 'READY'])
      .toArray();
    const push = await this.pushPendingChanges(tenantId, onProgress);
    const deviceId = await outboxRepository.getDeviceId();
    if (push.failed > 0) {
      return {
        pushed: push.synced,
        pulled: 0,
        conflicts: 0,
        errors: push.failed,
        checkpoint: await this.latestCheckpoint(tenantId, deviceId),
      };
    }

    let pulled = 0;
    let conflicts = 0;
    const siteIds = readySites.map((site) => site.siteId);
    const stored = await inspectionDb.syncCheckpoints.get(
      syncCheckpointKey(tenantId, deviceId)
    );
    let checkpoint = stored?.checkpoint ?? 0;
    let hasMore = true;
    while (hasMore) {
      onProgress?.({ phase: 'PULLING', processed: pulled, total: pulled });
      const response = await pullSyncBatch(
        tenantId,
        deviceId,
        checkpoint,
        siteIds
      );
      onProgress?.({
        phase: 'APPLYING',
        processed: 0,
        total: response.changes.length,
      });
      const result = await applyRemoteChanges({
        tenantId,
        deviceId,
        currentCheckpoint: checkpoint,
        response,
      });
      pulled += response.changes.length;
      conflicts += result.conflicts;
      onProgress?.({
        phase: 'APPLYING',
        processed: response.changes.length,
        total: response.changes.length,
      });
      if (response.hasMore && response.checkpoint <= checkpoint) {
        throw new Error('El servidor no avanzó el checkpoint del Pull.');
      }
      checkpoint = response.checkpoint;
      hasMore = response.hasMore;
    }
    await this.finalizeAcknowledged(tenantId);

    return {
      pushed: push.synced,
      pulled,
      conflicts,
      errors: 0,
      checkpoint,
    };
  }

  createBatches(items: OutboxItem[]) {
    const groups = new Map<string, OutboxItem[]>();
    for (const item of items) {
      const workId = this.workId(item);
      const key = `${item.tenantId}:${workId}`;
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }
    const batches: OutboxItem[][] = [];
    let current: OutboxItem[] = [];
    for (const group of groups.values()) {
      if (group.length > SYNC_BATCH_SIZE) {
        throw new Error(
          `El trabajo ${this.workId(
            group[0]
          )} supera el máximo de ${SYNC_BATCH_SIZE} cambios por lote.`
        );
      }
      if (
        current.length > 0 &&
        (current[0].tenantId !== group[0].tenantId ||
          current.length + group.length > SYNC_BATCH_SIZE)
      ) {
        batches.push(current);
        current = [];
      }
      current.push(...group);
    }
    if (current.length > 0) batches.push(current);
    return batches;
  }

  private async recoverInterruptedChanges(tenantId: string) {
    await inspectionDb.outbox
      .where('[tenantId+status]')
      .equals([tenantId, 'SENDING'])
      .modify({
        status: 'ERROR',
        lastError:
          'La sincronización anterior se interrumpió antes de confirmar.',
      });
  }

  private async markSending(items: OutboxItem[]) {
    const now = new Date().toISOString();
    await inspectionDb.transaction('rw', inspectionDb.outbox, async () => {
      for (const item of items) {
        await inspectionDb.outbox.update(item.id, {
          status: 'SENDING',
          attempts: item.attempts + 1,
          updatedAt: now,
          lastError: undefined,
        });
      }
    });
  }

  private async markAcknowledged(item: OutboxItem) {
    await inspectionDb.outbox.update(item.id, {
      status: 'ACKNOWLEDGED',
      lastError: undefined,
    });
  }

  private async markError(item: OutboxItem, message: string) {
    await inspectionDb.outbox.update(item.id, {
      status: 'ERROR',
      lastError: message,
    });
  }

  private domainTable(type: PendingChangeKind) {
    if (type === 'WORK') return inspectionDb.works;
    if (type === 'RESPONSE') return inspectionDb.conceptResponses;
    if (type === 'TASK_COMPLETION') return inspectionDb.taskCompletions;
    return inspectionDb.annotations;
  }

  private workId(item: OutboxItem) {
    if (item.entityType === 'WORK') return item.entityId;
    const workId = item.payload.workId;
    if (typeof workId !== 'string') {
      throw new Error(`El cambio ${item.id} no contiene un workId válido.`);
    }
    return workId;
  }

  private async latestCheckpoint(tenantId: string, deviceId: string) {
    const checkpoint = await inspectionDb.syncCheckpoints.get(
      syncCheckpointKey(tenantId, deviceId)
    );
    return checkpoint?.checkpoint ?? 0;
  }

  private async finalizeAcknowledged(tenantId: string) {
    const acknowledged = await inspectionDb.outbox
      .where('[tenantId+status]')
      .equals([tenantId, 'ACKNOWLEDGED'])
      .toArray();
    for (const item of acknowledged) {
      const table = this.domainTable(item.entityType);
      await inspectionDb.transaction(
        'rw',
        inspectionDb.outbox,
        inspectionDb.syncConflictCandidates,
        table,
        async () => {
          await inspectionDb.outbox.update(item.id, { status: 'SYNCED' });
          if (item.operation === 'DELETE') return;
          const [laterChanges, conflicts] = await Promise.all([
            inspectionDb.outbox
              .where('[tenantId+entityType+entityId]')
              .equals([item.tenantId, item.entityType, item.entityId])
              .filter(
                (candidate) =>
                  candidate.id !== item.id && candidate.status !== 'SYNCED'
              )
              .count(),
            inspectionDb.syncConflictCandidates
              .where('[tenantId+entityType+entityId]')
              .equals([item.tenantId, item.entityType, item.entityId])
              .filter((candidate) => candidate.status === 'PENDING')
              .count(),
          ]);
          if (laterChanges === 0 && conflicts === 0) {
            await table.update(item.entityId, { syncStatus: 'SYNCED' });
          }
        }
      );
    }
  }
}

export const syncService = new SyncService();
