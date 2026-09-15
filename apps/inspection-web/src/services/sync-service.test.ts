import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { pushSyncBatch } from '../features/offline/sync-api';
import type { LocalWork, OutboxItem } from '../features/offline/models';
import { SyncService } from './sync-service';

vi.mock('../features/offline/sync-api', () => ({
  pushSyncBatch: vi.fn(),
}));

const mockedPush = vi.mocked(pushSyncBatch);

describe('SyncService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await inspectionDb.delete();
    await inspectionDb.open();
    await inspectionDb.works.add(work());
    await inspectionDb.outbox.add(outbox());
  });

  afterEach(async () => inspectionDb.delete());

  it('marca outbox y dominio como sincronizados tras el ACK', async () => {
    mockedPush.mockResolvedValue([
      {
        outboxId: 'outbox-1',
        entityId: 'work-1',
        success: true,
        serverTimestamp: '2026-09-15T12:01:00.000Z',
      },
    ]);

    await expect(new SyncService().pushPendingChanges()).resolves.toEqual({
      total: 1,
      synced: 1,
      failed: 0,
    });
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'SYNCED',
      attempts: 1,
    });
    await expect(inspectionDb.works.get('work-1')).resolves.toMatchObject({
      syncStatus: 'SYNCED',
    });
  });

  it('reutiliza el mismo outboxId después de perder la respuesta', async () => {
    mockedPush.mockRejectedValueOnce(new Error('Conexión interrumpida'));
    const service = new SyncService();

    await expect(service.pushPendingChanges()).resolves.toEqual({
      total: 1,
      synced: 0,
      failed: 1,
    });
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'ERROR',
      attempts: 1,
      lastError: 'Conexión interrumpida',
    });

    mockedPush.mockResolvedValueOnce([
      { outboxId: 'outbox-1', entityId: 'work-1', success: true },
    ]);
    await service.pushPendingChanges();

    expect(mockedPush.mock.calls[0][2][0].id).toBe('outbox-1');
    expect(mockedPush.mock.calls[1][2][0].id).toBe('outbox-1');
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'SYNCED',
      attempts: 2,
    });
  });
});

function work(): LocalWork {
  return {
    id: 'work-1',
    tenantId: 'tenant-1',
    siteId: 'site-1',
    assetId: 'asset-1',
    workTypeId: 'type-1',
    formTemplateId: 'template-1',
    formTemplateVersion: 1,
    title: 'Inspección offline',
    executionDate: '2026-09-15',
    responsible: 'Inspector',
    status: 'DRAFT',
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
    syncStatus: 'LOCAL_ONLY',
  };
}

function outbox(): OutboxItem {
  return {
    id: 'outbox-1',
    tenantId: 'tenant-1',
    entityType: 'WORK',
    entityId: 'work-1',
    operation: 'CREATE',
    payload: work(),
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
    status: 'PENDING',
    attempts: 0,
  };
}
