import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import type { OutboxItem } from '../features/offline/models';
import { offlineRepository } from './offline-repository';

describe('offlineRepository tenant scope', () => {
  beforeEach(async () => {
    await inspectionDb.delete();
    await inspectionDb.open();
  });

  afterEach(async () => inspectionDb.delete());

  it('filtra pendientes y metadata por tenant', async () => {
    await inspectionDb.outbox.bulkAdd([
      outbox('tenant-1', 'outbox-1'),
      outbox('tenant-2', 'outbox-2'),
    ]);
    await inspectionDb.syncCheckpoints.bulkAdd([
      checkpoint('tenant-1', 11),
      checkpoint('tenant-2', 99),
    ]);
    await inspectionDb.syncConflictCandidates.bulkAdd([
      conflict('tenant-1', 'conflict-1'),
      conflict('tenant-2', 'conflict-2'),
    ]);

    await expect(
      offlineRepository.getPendingSummary('tenant-1')
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: 'outbox-1', tenantId: 'tenant-1' }],
    });
    await expect(
      offlineRepository.getSyncMetadata('tenant-1')
    ).resolves.toEqual({
      checkpoint: 11,
      lastSyncAt: '2026-09-23T12:00:00.000Z',
      conflicts: 1,
    });
  });
});

function outbox(tenantId: string, id: string): OutboxItem {
  return {
    id,
    tenantId,
    entityType: 'WORK',
    entityId: `work-${tenantId}`,
    operation: 'CREATE',
    payload: { title: tenantId },
    createdAt: '2026-09-23T12:00:00.000Z',
    updatedAt: '2026-09-23T12:00:00.000Z',
    status: 'PENDING',
    attempts: 0,
  };
}

function checkpoint(tenantId: string, value: number) {
  return {
    id: `${tenantId}:device-1`,
    tenantId,
    deviceId: 'device-1',
    checkpoint: value,
    updatedAt: '2026-09-23T12:00:00.000Z',
  };
}

function conflict(tenantId: string, id: string) {
  return {
    id,
    tenantId,
    entityType: 'WORK' as const,
    entityId: `work-${tenantId}`,
    localData: {},
    remoteData: {},
    remoteSequence: 1,
    detectedAt: '2026-09-23T12:00:00.000Z',
    status: 'PENDING' as const,
  };
}
