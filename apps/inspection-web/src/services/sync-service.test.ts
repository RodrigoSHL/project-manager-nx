import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { pullSyncBatch, pushSyncBatch } from '../features/offline/sync-api';
import type { LocalWork, OutboxItem } from '../features/offline/models';
import { checkApiReachability } from './connectivity-service';
import { SyncService } from './sync-service';
import {
  listWorkPhotos,
  uploadWorkPhoto,
} from '../features/works/work-photo-api';
import { localPhotoRepository } from '../repositories/local-photo-repository';

vi.mock('../features/offline/sync-api', () => ({
  pushSyncBatch: vi.fn(),
  pullSyncBatch: vi.fn(),
}));
vi.mock('./connectivity-service', () => ({ checkApiReachability: vi.fn() }));
vi.mock('../features/works/work-photo-api', () => ({
  listWorkPhotos: vi.fn(),
  uploadWorkPhoto: vi.fn(),
  MAX_WORK_PHOTO_SIZE: 10 * 1024 * 1024,
  WORK_PHOTO_ACCEPT: 'image/jpeg,image/png,image/webp',
}));

const mockedPush = vi.mocked(pushSyncBatch);
const mockedPull = vi.mocked(pullSyncBatch);
const mockedReachability = vi.mocked(checkApiReachability);
const mockedListPhotos = vi.mocked(listWorkPhotos);
const mockedUploadPhoto = vi.mocked(uploadWorkPhoto);

describe('SyncService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockedReachability.mockResolvedValue(true);
    mockedListPhotos.mockResolvedValue([]);
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

  it('sube una foto offline una sola vez después de enviar el trabajo', async () => {
    const photo = await localPhotoRepository.save(
      'tenant-1',
      'work-1',
      'item-1',
      new File(['imagen'], 'equipo.jpg', { type: 'image/jpeg' })
    );
    await localPhotoRepository.save(
      'tenant-2',
      'work-2',
      'item-2',
      new File(['otra'], 'otra.jpg', { type: 'image/jpeg' })
    );
    mockedPush.mockResolvedValue([
      { outboxId: 'outbox-1', entityId: 'work-1', success: true },
    ]);
    mockedUploadPhoto.mockResolvedValue({
      id: 'remote-photo-1',
      application: 'inspection-web',
      ownerType: 'work',
      ownerId: 'work-1',
      originalName: 'equipo.jpg',
      mimeType: 'image/jpeg',
      size: 6,
      metadata: {
        category: 'work-item-photo',
        tenantId: 'tenant-1',
        formItemId: 'item-1',
        clientPhotoId: photo.id,
      },
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
    });
    mockedPull.mockResolvedValue({
      changes: [],
      checkpoint: 0,
      hasMore: false,
    });

    await expect(new SyncService().sync('tenant-1')).resolves.toMatchObject({
      pushed: 2,
      errors: 0,
    });
    expect(mockedUploadPhoto).toHaveBeenCalledWith(
      'tenant-1',
      'work-1',
      'item-1',
      expect.any(File),
      { clientPhotoId: photo.id, capturedAt: photo.createdAt }
    );
    expect(mockedPush.mock.invocationCallOrder[0]).toBeLessThan(
      mockedUploadPhoto.mock.invocationCallOrder[0]
    );
    expect(await localPhotoRepository.retryable('tenant-1')).toHaveLength(0);
    expect(await localPhotoRepository.retryable('tenant-2')).toHaveLength(1);
  });

  it('recupera una foto subida cuando se perdió la respuesta del servidor', async () => {
    const photo = await localPhotoRepository.save(
      'tenant-1',
      'work-1',
      'item-1',
      new File(['imagen'], 'equipo.jpg', { type: 'image/jpeg' })
    );
    const remote = {
      id: 'remote-photo-1',
      application: 'inspection-web' as const,
      ownerType: 'work' as const,
      ownerId: 'work-1',
      originalName: 'equipo.jpg',
      mimeType: 'image/jpeg',
      size: 6,
      metadata: {
        category: 'work-item-photo' as const,
        tenantId: 'tenant-1',
        formItemId: 'item-1',
        clientPhotoId: photo.id,
      },
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
    };
    mockedListPhotos.mockResolvedValueOnce([]).mockResolvedValueOnce([remote]);
    mockedUploadPhoto.mockRejectedValueOnce(new Error('Conexión interrumpida'));

    const service = new SyncService();
    await expect(service.pushPendingPhotos('tenant-1')).resolves.toEqual({
      total: 1,
      synced: 0,
      failed: 1,
    });
    await expect(service.pushPendingPhotos('tenant-1')).resolves.toEqual({
      total: 1,
      synced: 1,
      failed: 0,
    });
    expect(mockedUploadPhoto).toHaveBeenCalledTimes(1);
    expect(await localPhotoRepository.retryable('tenant-1')).toHaveLength(0);
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
