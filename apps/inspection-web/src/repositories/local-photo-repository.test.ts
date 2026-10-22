import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { localPhotoRepository } from './local-photo-repository';

describe('localPhotoRepository', () => {
  beforeEach(async () => {
    await inspectionDb.delete();
    await inspectionDb.open();
  });

  afterEach(async () => inspectionDb.delete());

  it('guarda la imagen y su referencia en IndexedDB para el tenant correcto', async () => {
    const file = new File(['foto offline'], 'transformador.jpg', {
      type: 'image/jpeg',
    });
    const photo = await localPhotoRepository.save(
      'tenant-1',
      'work-1',
      'item-1',
      file
    );

    expect(photo).toMatchObject({
      tenantId: 'tenant-1',
      workId: 'work-1',
      workItemId: 'item-1',
      status: 'LOCAL_ONLY',
    });
    inspectionDb.close();
    await inspectionDb.open();
    expect(await localPhotoRepository.list('tenant-1', 'work-1')).toHaveLength(
      1
    );
    expect(await localPhotoRepository.list('tenant-2', 'work-1')).toHaveLength(
      0
    );
    expect(await (await localPhotoRepository.blob(photo.id))?.blob.text()).toBe(
      'foto offline'
    );

    await localPhotoRepository.removeLocal('tenant-1', 'work-1', photo.id);
    expect(await localPhotoRepository.blob(photo.id)).toBeUndefined();
    expect(await localPhotoRepository.list('tenant-1', 'work-1')).toHaveLength(
      0
    );
  });

  it('conserva la copia local al confirmar el archivo remoto', async () => {
    const photo = await localPhotoRepository.save(
      'tenant-1',
      'work-1',
      'item-1',
      new File(['foto'], 'foto.png', { type: 'image/png' })
    );
    await localPhotoRepository.markUploading(photo.id);
    await localPhotoRepository.markUploaded(photo.id, 'remote-1');

    expect(await localPhotoRepository.retryable('tenant-1')).toHaveLength(0);
    expect(await localPhotoRepository.blob(photo.id)).toBeDefined();
    await expect(
      localPhotoRepository.removeLocal('tenant-1', 'work-1', photo.id)
    ).rejects.toThrow('ya está sincronizada');
  });

  it('guarda una foto remota para verla sin conexión', async () => {
    await localPhotoRepository.cacheRemote(
      {
        id: 'remote-photo-1',
        application: 'inspection-web',
        ownerType: 'work',
        ownerId: 'work-1',
        originalName: 'antes.jpg',
        mimeType: 'image/jpeg',
        size: 6,
        metadata: {
          category: 'work-item-photo',
          tenantId: 'tenant-1',
          formItemId: 'item-1',
        },
        createdAt: '2026-10-04T12:00:00.000Z',
        updatedAt: '2026-10-04T12:00:00.000Z',
      },
      new Blob(['imagen'], { type: 'image/jpeg' })
    );

    expect(await localPhotoRepository.list('tenant-1', 'work-1')).toMatchObject(
      [{ id: 'remote-photo-1', status: 'REMOTE_ONLY' }]
    );
    expect(
      await (await localPhotoRepository.blob('remote-photo-1'))?.blob.text()
    ).toBe('imagen');
    expect(await localPhotoRepository.retryable('tenant-1')).toHaveLength(0);
  });
});
