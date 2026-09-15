import { inspectionDb } from '../db/inspection-db';
import { pushSyncBatch } from '../features/offline/sync-api';
import type {
  OutboxItem,
  PendingChangeKind,
  SyncProgress,
  SyncSummary,
} from '../features/offline/models';
import { outboxRepository } from '../repositories/outbox-repository';

export const SYNC_BATCH_SIZE = 50;

export class SyncService {
  async pushPendingChanges(
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncSummary> {
    await this.recoverInterruptedChanges();
    const pending = await outboxRepository.listRetryable();
    const total = pending.length;
    let processed = 0;
    let synced = 0;
    let failed = 0;
    onProgress?.({ processed, total });
    if (total === 0) return { total, synced, failed };

    const deviceId = await outboxRepository.getDeviceId();
    for (const batch of this.createBatches(pending)) {
      await this.markSending(batch);
      try {
        const results = await pushSyncBatch(
          batch[0].tenantId,
          deviceId,
          batch
        );
        const resultById = new Map(
          results.map((result) => [result.outboxId, result])
        );
        for (const item of batch) {
          const result = resultById.get(item.id);
          if (result?.success) {
            await this.markSynced(item);
            synced += 1;
          } else {
            await this.markError(
              item,
              result?.error || 'El servidor no respondió por este cambio.'
            );
            failed += 1;
          }
          processed += 1;
          onProgress?.({ processed, total });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error de sincronización';
        for (const item of batch) {
          await this.markError(item, message);
          failed += 1;
          processed += 1;
          onProgress?.({ processed, total });
        }
        break;
      }
    }
    return { total, synced, failed };
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
          `El trabajo ${this.workId(group[0])} supera el máximo de ${SYNC_BATCH_SIZE} cambios por lote.`
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

  private async recoverInterruptedChanges() {
    await inspectionDb.outbox
      .filter((item) => item.status === 'SENDING')
      .modify({
        status: 'ERROR',
        lastError: 'La sincronización anterior se interrumpió antes de confirmar.',
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

  private async markSynced(item: OutboxItem) {
    const domainTable = this.domainTable(item.entityType);
    await inspectionDb.transaction(
      'rw',
      inspectionDb.outbox,
      domainTable,
      async () => {
        await inspectionDb.outbox.update(item.id, {
          status: 'SYNCED',
          lastError: undefined,
        });
        const laterChanges = await inspectionDb.outbox
          .where('[tenantId+entityType+entityId]')
          .equals([item.tenantId, item.entityType, item.entityId])
          .filter(
            (candidate) =>
              candidate.id !== item.id && candidate.status !== 'SYNCED'
          )
          .count();
        if (laterChanges === 0 && item.operation !== 'DELETE') {
          await domainTable.update(item.entityId, { syncStatus: 'SYNCED' });
        }
      }
    );
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
}

export const syncService = new SyncService();
