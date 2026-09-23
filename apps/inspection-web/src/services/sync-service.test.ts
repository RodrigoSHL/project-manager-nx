import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { pullSyncBatch, pushSyncBatch } from '../features/offline/sync-api';
import type { LocalWork, OutboxItem } from '../features/offline/models';
import { checkApiReachability } from './connectivity-service';
import { SyncService } from './sync-service';

vi.mock('../features/offline/sync-api', () => ({
  pushSyncBatch: vi.fn(),
  pullSyncBatch: vi.fn(),
}));
vi.mock('./connectivity-service', () => ({ checkApiReachability: vi.fn() }));

const mockedPush = vi.mocked(pushSyncBatch);
const mockedPull = vi.mocked(pullSyncBatch);
const mockedReachability = vi.mocked(checkApiReachability);

describe('SyncService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockedReachability.mockResolvedValue(true);
    await inspectionDb.delete();
    await inspectionDb.open();
    await inspectionDb.works.add(work());
    await inspectionDb.outbox.add(outbox());
  });

  afterEach(async () => inspectionDb.delete());

  it('marca el outbox como confirmado hasta que Pull reciba el eco', async () => {
    mockedPush.mockResolvedValue([
      {
        outboxId: 'outbox-1',
        entityId: 'work-1',
        success: true,
        serverTimestamp: '2026-09-15T12:01:00.000Z',
      },
    ]);

    await expect(
      new SyncService().pushPendingChanges('tenant-1')
    ).resolves.toEqual({
      total: 1,
      synced: 1,
      failed: 0,
    });
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'ACKNOWLEDGED',
      attempts: 1,
    });
    await expect(inspectionDb.works.get('work-1')).resolves.toMatchObject({
      syncStatus: 'LOCAL_ONLY',
    });
  });

  it('reutiliza el mismo outboxId después de perder la respuesta', async () => {
    mockedPush.mockRejectedValueOnce(new Error('Conexión interrumpida'));
    const service = new SyncService();

    await expect(service.pushPendingChanges('tenant-1')).resolves.toEqual({
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
    await service.pushPendingChanges('tenant-1');

    expect(mockedPush.mock.calls[0][2][0].id).toBe('outbox-1');
    expect(mockedPush.mock.calls[1][2][0].id).toBe('outbox-1');
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'ACKNOWLEDGED',
      attempts: 2,
    });
  });

  it('ejecuta PUSH y repite PULL hasta completar los batches', async () => {
    mockedPush.mockResolvedValue([
      { outboxId: 'outbox-1', entityId: 'work-1', success: true },
    ]);
    mockedPull
      .mockResolvedValueOnce({
        changes: [
          {
            sequence: 1,
            entityType: 'ASSET_TYPE',
            entityId: 'asset-type-1',
            operation: 'CREATE',
            payload: {
              id: 'asset-type-1',
              tenantId: 'tenant-1',
              code: 'TRANSFORMER',
              name: 'Transformador',
              active: true,
            },
            serverUpdatedAt: '2026-09-18T12:00:00.000Z',
          },
        ],
        checkpoint: 1,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        changes: [],
        checkpoint: 2,
        hasMore: false,
      });

    await expect(new SyncService().sync('tenant-1')).resolves.toEqual({
      pushed: 1,
      pulled: 1,
      conflicts: 0,
      errors: 0,
      checkpoint: 2,
    });
    expect(mockedPull).toHaveBeenCalledTimes(2);
    expect(mockedPull.mock.calls[1][2]).toBe(1);
    await expect(inspectionDb.assetTypes.get('asset-type-1')).resolves.toEqual(
      expect.objectContaining({ name: 'Transformador' })
    );
    await expect(inspectionDb.outbox.get('outbox-1')).resolves.toMatchObject({
      status: 'SYNCED',
    });
    await expect(inspectionDb.works.get('work-1')).resolves.toMatchObject({
      syncStatus: 'SYNCED',
    });
  });

  it('sincroniza solamente el tenant solicitado', async () => {
    await inspectionDb.works.add(
      work({ id: 'work-2', tenantId: 'tenant-2', siteId: 'site-2' })
    );
    await inspectionDb.outbox.add(
      outbox({
        id: 'outbox-2',
        tenantId: 'tenant-2',
        entityId: 'work-2',
        payload: work({
          id: 'work-2',
          tenantId: 'tenant-2',
          siteId: 'site-2',
        }),
      })
    );
    mockedPush.mockResolvedValue([
      { outboxId: 'outbox-1', entityId: 'work-1', success: true },
    ]);
    mockedPull.mockResolvedValue({
      changes: [],
      checkpoint: 10,
      hasMore: false,
    });

    await new SyncService().sync('tenant-1');

    expect(mockedPush).toHaveBeenCalledTimes(1);
    expect(mockedPush.mock.calls[0][0]).toBe('tenant-1');
    expect(mockedPush.mock.calls[0][2].map((item) => item.id)).toEqual([
      'outbox-1',
    ]);
    expect(mockedPull).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(String),
      0,
      []
    );
    await expect(inspectionDb.outbox.get('outbox-2')).resolves.toMatchObject({
      status: 'PENDING',
      attempts: 0,
    });
  });
});

function work(overrides: Partial<LocalWork> = {}): LocalWork {
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
    ...overrides,
  };
}

function outbox(overrides: Partial<OutboxItem> = {}): OutboxItem {
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
    ...overrides,
  };
}
