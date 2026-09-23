import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb, syncCheckpointKey } from '../db/inspection-db';
import type { LocalWork, OutboxItem } from '../features/offline/models';
import { applyRemoteChanges } from './apply-remote-changes';

const tenantId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const workId = '33333333-3333-4333-8333-333333333333';

describe('applyRemoteChanges', () => {
  beforeEach(async () => {
    await inspectionDb.delete();
    await inspectionDb.open();
  });

  afterEach(async () => inspectionDb.delete());

  it('aplica un UPDATE remoto sobre un registro sincronizado y avanza checkpoint', async () => {
    await inspectionDb.works.put(work('SYNCED', 'Versión local'));

    await applyRemoteChanges({
      tenantId,
      deviceId,
      currentCheckpoint: 40,
      response: {
        changes: [remoteWorkChange(41, 'Versión servidor')],
        checkpoint: 41,
        hasMore: false,
      },
    });

    await expect(inspectionDb.works.get(workId)).resolves.toMatchObject({
      title: 'Versión servidor',
      syncStatus: 'SYNCED',
    });
    await expect(
      inspectionDb.syncCheckpoints.get(syncCheckpointKey(tenantId, deviceId))
    ).resolves.toMatchObject({ checkpoint: 41 });
  });

  it('preserva un registro MODIFIED y crea un candidato de conflicto', async () => {
    await inspectionDb.works.put(work('MODIFIED', 'Cambio offline'));

    const result = await applyRemoteChanges({
      tenantId,
      deviceId,
      currentCheckpoint: 50,
      response: {
        changes: [remoteWorkChange(51, 'Cambio servidor')],
        checkpoint: 51,
        hasMore: false,
      },
    });

    expect(result.conflicts).toBe(1);
    await expect(inspectionDb.works.get(workId)).resolves.toMatchObject({
      title: 'Cambio offline',
      syncStatus: 'MODIFIED',
    });
    await expect(
      inspectionDb.syncConflictCandidates.toArray()
    ).resolves.toMatchObject([
      {
        entityId: workId,
        remoteSequence: 51,
        status: 'PENDING',
      },
    ]);
  });

  it('distingue un cambio remoto previo del eco del Push propio', async () => {
    const local = work('MODIFIED', 'Cambio de este dispositivo');
    await inspectionDb.works.put(local);
    const pushed: OutboxItem = {
      id: '88888888-8888-4888-8888-888888888888',
      tenantId,
      entityType: 'WORK',
      entityId: workId,
      operation: 'UPDATE',
      payload: local,
      createdAt: '2026-09-18T11:00:00.000Z',
      updatedAt: '2026-09-18T11:00:00.000Z',
      status: 'ACKNOWLEDGED',
      attempts: 1,
    };
    await inspectionDb.outbox.put(pushed);

    const result = await applyRemoteChanges({
      tenantId,
      deviceId,
      currentCheckpoint: 60,
      response: {
        changes: [
          remoteWorkChange(61, 'Cambio de otro dispositivo'),
          {
            ...remoteWorkChange(62, 'Cambio de este dispositivo'),
            sourceDeviceId: deviceId,
          },
        ],
        checkpoint: 62,
        hasMore: false,
      },
    });

    expect(result.conflicts).toBe(1);
    await expect(inspectionDb.works.get(workId)).resolves.toMatchObject({
      title: 'Cambio de este dispositivo',
      syncStatus: 'SYNCED',
    });
    await expect(
      inspectionDb.syncConflictCandidates.toArray()
    ).resolves.toMatchObject([
      {
        remoteSequence: 61,
        remoteData: { title: 'Cambio de otro dispositivo' },
      },
    ]);
    await expect(inspectionDb.outbox.get(pushed.id)).resolves.toMatchObject({
      status: 'SYNCED',
    });
  });

  it('revierte datos y checkpoint si falla cualquier cambio del lote', async () => {
    const siteId = '44444444-4444-4444-8444-444444444444';
    await expect(
      applyRemoteChanges({
        tenantId,
        deviceId,
        currentCheckpoint: 0,
        response: {
          changes: [
            {
              sequence: 1,
              entityType: 'SITE',
              entityId: siteId,
              operation: 'CREATE',
              payload: {
                id: siteId,
                tenantId,
                code: 'NORTE',
                name: 'Mina Norte',
                type: 'MINE',
                active: true,
              },
              serverUpdatedAt: '2026-09-18T12:00:00.000Z',
            },
            {
              sequence: 2,
              entityType: 'ASSET_TYPE',
              entityId: '55555555-5555-4555-8555-555555555555',
              operation: 'CREATE',
              payload: {
                id: '55555555-5555-4555-8555-555555555555',
                tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              },
              serverUpdatedAt: '2026-09-18T12:00:01.000Z',
            },
          ],
          checkpoint: 2,
          hasMore: false,
        },
      })
    ).rejects.toThrow('no coincide');

    await expect(inspectionDb.sites.get(siteId)).resolves.toBeUndefined();
    await expect(inspectionDb.syncCheckpoints.count()).resolves.toBe(0);
  });
});

function work(syncStatus: LocalWork['syncStatus'], title: string): LocalWork {
  return {
    id: workId,
    tenantId,
    siteId: '44444444-4444-4444-8444-444444444444',
    assetId: '55555555-5555-4555-8555-555555555555',
    workTypeId: '66666666-6666-4666-8666-666666666666',
    formTemplateId: '77777777-7777-4777-8777-777777777777',
    formTemplateVersion: 1,
    title,
    executionDate: '2026-09-18',
    responsible: 'Inspector',
    status: 'IN_PROGRESS',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T11:00:00.000Z',
    syncStatus,
  };
}

function remoteWorkChange(sequence: number, title: string) {
  return {
    sequence,
    entityType: 'WORK' as const,
    entityId: workId,
    operation: 'UPDATE' as const,
    payload: {
      ...work('SYNCED', title),
      formSnapshot: {
        workId,
        tenantId,
        formTemplateId: '77777777-7777-4777-8777-777777777777',
        formTemplateVersion: 1,
        name: 'Formulario',
        sections: [],
      },
    },
    serverUpdatedAt: '2026-09-18T12:00:00.000Z',
  };
}
