import { inspectionDb } from '../db/inspection-db';
import type {
  OutboxItem,
  OutboxOperation,
  PendingChangeKind,
} from '../features/offline/models';

export type EnqueueChange = {
  tenantId: string;
  entityType: PendingChangeKind;
  entityId: string;
  operation: OutboxOperation;
  payload: Record<string, unknown>;
  timestamp?: string;
};

export async function enqueueOutboxChange(change: EnqueueChange) {
  const candidates = await inspectionDb.outbox
    .where('[tenantId+entityType+entityId]')
    .equals([change.tenantId, change.entityType, change.entityId])
    .filter((item) => item.status === 'PENDING' || item.status === 'ERROR')
    .sortBy('updatedAt');
  const existing = candidates.at(-1);
  const now = change.timestamp ?? new Date().toISOString();

  if (!existing) {
    const item: OutboxItem = {
      id: crypto.randomUUID(),
      tenantId: change.tenantId,
      entityType: change.entityType,
      entityId: change.entityId,
      operation: change.operation,
      payload: change.payload,
      createdAt: now,
      updatedAt: now,
      status: 'PENDING',
      attempts: 0,
    };
    await inspectionDb.outbox.add(item);
    return item;
  }

  if (
    existing.operation === 'CREATE' &&
    change.operation === 'DELETE'
  ) {
    await inspectionDb.outbox.delete(existing.id);
    return undefined;
  }
  const operation =
    existing.operation === 'CREATE'
      ? 'CREATE'
      : change.operation === 'DELETE'
      ? 'DELETE'
      : existing.operation === 'DELETE'
      ? 'DELETE'
      : 'UPDATE';
  const updated: OutboxItem = {
    ...existing,
    operation,
    payload: change.payload,
    updatedAt: now,
    status: 'PENDING',
    lastError: undefined,
  };
  await inspectionDb.outbox.put(updated);
  return updated;
}

export const outboxRepository = {
  enqueue: enqueueOutboxChange,
  async listRetryable(tenantId?: string) {
    const items = tenantId
      ? await inspectionDb.outbox
          .where('[tenantId+status]')
          .anyOf([
            [tenantId, 'PENDING'],
            [tenantId, 'ERROR'],
          ])
          .toArray()
      : await inspectionDb.outbox
          .filter((item) => item.status === 'PENDING' || item.status === 'ERROR')
          .toArray();
    return items.sort(
      (left, right) =>
        entityOrder(left.entityType) - entityOrder(right.entityType) ||
        left.createdAt.localeCompare(right.createdAt)
    );
  },
  async getDeviceId() {
    const existing = await inspectionDb.deviceMetadata.get('current');
    if (existing) return existing.deviceId;
    const deviceId = crypto.randomUUID();
    await inspectionDb.deviceMetadata.add({
      id: 'current',
      deviceId,
      createdAt: new Date().toISOString(),
    });
    return deviceId;
  },
};

function entityOrder(type: PendingChangeKind) {
  if (type === 'WORK') return 0;
  if (type === 'RESPONSE') return 1;
  if (type === 'TASK_COMPLETION') return 2;
  return 3;
}
