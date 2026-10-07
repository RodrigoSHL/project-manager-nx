import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import type { Asset } from '../features/assets/models';
import type { LocalWork } from '../features/offline/models';
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

  it('cuenta solo la copia local de la empresa seleccionada', async () => {
    await inspectionDb.assets.bulkAdd([
      asset('tenant-1', 'asset-1'),
      asset('tenant-2', 'asset-2'),
    ]);
    await inspectionDb.works.bulkAdd([
      work('tenant-1', 'work-1', 'LOCAL_ONLY'),
      work('tenant-2', 'work-2', 'MODIFIED'),
    ]);
    await inspectionDb.fileReferences.bulkAdd([
      {
        id: 'file-1',
        tenantId: 'tenant-1',
        workId: 'work-1',
        workItemId: 'item-1',
        mimeType: 'image/jpeg',
        originalName: 'a.jpg',
        size: 12,
        status: 'REMOTE_ONLY',
      },
      {
        id: 'file-2',
        tenantId: 'tenant-2',
        workId: 'work-2',
        workItemId: 'item-2',
        mimeType: 'image/jpeg',
        originalName: 'b.jpg',
        size: 12,
        status: 'REMOTE_ONLY',
      },
    ]);

    await expect(offlineRepository.getStats('tenant-1')).resolves.toMatchObject(
      {
        assets: 1,
        works: 1,
        localOnly: 1,
        modified: 0,
        files: 1,
      }
    );
    await expect(offlineRepository.getStats('tenant-2')).resolves.toMatchObject(
      {
        assets: 1,
        works: 1,
        localOnly: 0,
        modified: 1,
        files: 1,
      }
    );
  });

  it('muestra las fotos pendientes solamente en la empresa correspondiente', async () => {
    await inspectionDb.fileReferences.bulkAdd([
      {
        id: 'local-photo-1',
        tenantId: 'tenant-1',
        workId: 'work-1',
        workItemId: 'item-1',
        mimeType: 'image/jpeg',
        originalName: 'equipo.jpg',
        size: 4,
        status: 'LOCAL_ONLY',
      },
      {
        id: 'local-photo-2',
        tenantId: 'tenant-2',
        workId: 'work-2',
        workItemId: 'item-2',
        mimeType: 'image/jpeg',
        originalName: 'otro.jpg',
        size: 4,
        status: 'LOCAL_ONLY',
      },
    ]);

    await expect(
      offlineRepository.getPendingSummary('tenant-1')
    ).resolves.toMatchObject({
      total: 1,
      photos: 1,
      items: [{ id: 'local-photo-1', kind: 'PHOTO', label: 'equipo.jpg' }],
    });
  });
});

function asset(tenantId: string, id: string): Asset {
  return {
    id,
    tenantId,
    siteId: `site-${tenantId}`,
    code: id,
    name: id,
    assetTypeId: 'type-1',
    parentId: null,
    status: 'ACTIVE',
  };
}

function work(
  tenantId: string,
  id: string,
  syncStatus: LocalWork['syncStatus']
): LocalWork {
  return {
    id,
    tenantId,
    siteId: `site-${tenantId}`,
    assetId: `asset-${tenantId}`,
    workTypeId: 'work-type-1',
    formTemplateId: 'form-1',
    formTemplateVersion: 1,
    title: id,
    executionDate: '2026-10-04',
    responsible: 'Tester',
    status: 'DRAFT',
    createdAt: '2026-10-04T00:00:00Z',
    updatedAt: '2026-10-04T00:00:00Z',
    syncStatus,
  };
}

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
