import { inspectionDb } from '../db/inspection-db';
import type { LocalFileReference } from '../features/offline/models';
import {
  MAX_WORK_PHOTO_SIZE,
  WORK_PHOTO_ACCEPT,
} from '../features/works/work-photo-api';
import type { WorkItemPhoto } from '../features/works/models';

const acceptedTypes = new Set(WORK_PHOTO_ACCEPT.split(','));

export const localPhotoRepository = {
  async save(
    tenantId: string,
    workId: string,
    workItemId: string,
    file: File,
    identity?: { id: string; capturedAt: string }
  ): Promise<LocalFileReference> {
    if (file.size > MAX_WORK_PHOTO_SIZE) {
      throw new Error('La foto supera el límite de 10 MB.');
    }
    if (!acceptedTypes.has(file.type)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WebP.');
    }
    const now = identity?.capturedAt ?? new Date().toISOString();
    const reference: LocalFileReference = {
      id: identity?.id ?? crypto.randomUUID(),
      tenantId,
      workId,
      workItemId,
      mimeType: file.type,
      originalName: file.name,
      size: file.size,
      status: 'LOCAL_ONLY',
      createdAt: now,
      updatedAt: now,
      attempts: 0,
    };
    try {
      await inspectionDb.transaction(
        'rw',
        inspectionDb.fileReferences,
        inspectionDb.fileBlobs,
        async () => {
          await inspectionDb.fileBlobs.add({
            id: reference.id,
            blob: file.slice(0, file.size, file.type),
          });
          await inspectionDb.fileReferences.add(reference);
        }
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        throw new Error(
          'No queda espacio en este navegador para guardar la foto.'
        );
      }
      throw error;
    }
    return reference;
  },

  list(tenantId: string, workId: string) {
    return inspectionDb.fileReferences
      .where('[tenantId+workId]')
      .equals([tenantId, workId])
      .toArray();
  },

  blob(id: string) {
    return inspectionDb.fileBlobs.get(id);
  },

  async removeLocal(tenantId: string, workId: string, id: string) {
    const reference = await inspectionDb.fileReferences.get(id);
    if (
      !reference ||
      reference.tenantId !== tenantId ||
      reference.workId !== workId
    ) {
      throw new Error('La fotografía no está disponible en este trabajo.');
    }
    if (reference.status === 'PENDING_UPLOAD') {
      throw new Error(
        'La fotografía se está enviando. Espera a que termine la sincronización.'
      );
    }
    if (reference.status === 'REMOTE_ONLY') {
      throw new Error('Esta fotografía ya está sincronizada.');
    }
    await inspectionDb.transaction(
      'rw',
      inspectionDb.fileReferences,
      inspectionDb.fileBlobs,
      async () => {
        await inspectionDb.fileReferences.delete(id);
        await inspectionDb.fileBlobs.delete(id);
      }
    );
  },

  async removeRemoteCopy(
    tenantId: string,
    workId: string,
    remoteFileId: string
  ) {
    const references = await inspectionDb.fileReferences
      .where('[tenantId+workId]')
      .equals([tenantId, workId])
      .filter((item) => item.remoteFileId === remoteFileId)
      .toArray();
    if (!references.length) return;
    await inspectionDb.transaction(
      'rw',
      inspectionDb.fileReferences,
      inspectionDb.fileBlobs,
      async () => {
        await inspectionDb.fileReferences.bulkDelete(
          references.map((item) => item.id)
        );
        await inspectionDb.fileBlobs.bulkDelete(
          references.map((item) => item.id)
        );
      }
    );
  },

  async cacheRemote(photo: WorkItemPhoto, blob: Blob) {
    try {
      await inspectionDb.transaction(
        'rw',
        inspectionDb.fileReferences,
        inspectionDb.fileBlobs,
        async () => {
          await inspectionDb.fileReferences.put({
            id: photo.id,
            remoteFileId: photo.id,
            tenantId: photo.metadata.tenantId,
            workId: photo.ownerId,
            workItemId: photo.metadata.formItemId,
            mimeType: photo.mimeType,
            originalName: photo.originalName,
            size: photo.size,
            status: 'REMOTE_ONLY',
            createdAt: photo.createdAt,
            updatedAt: photo.updatedAt,
          });
          await inspectionDb.fileBlobs.put({ id: photo.id, blob });
        }
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        throw new Error(
          'No queda espacio en este navegador para descargar las fotos.'
        );
      }
      throw error;
    }
  },

  async retryable(tenantId: string) {
    return (
      await inspectionDb.fileReferences
        .where('tenantId')
        .equals(tenantId)
        .toArray()
    )
      .filter((item) => item.status !== 'REMOTE_ONLY')
      .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  },

  async markUploading(id: string) {
    const reference = await inspectionDb.fileReferences.get(id);
    if (!reference) return;
    await inspectionDb.fileReferences.update(id, {
      status: 'PENDING_UPLOAD',
      attempts: (reference.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    });
  },

  async markUploaded(id: string, remoteFileId: string) {
    await inspectionDb.fileReferences.update(id, {
      status: 'REMOTE_ONLY',
      remoteFileId,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    });
  },

  async markError(id: string, message: string) {
    await inspectionDb.fileReferences.update(id, {
      status: 'ERROR',
      updatedAt: new Date().toISOString(),
      lastError: message,
    });
  },
};

export function localPhotoAsWorkPhoto(
  reference: LocalFileReference
): WorkItemPhoto {
  return {
    id: reference.remoteFileId ?? reference.id,
    application: 'inspection-web',
    ownerType: 'work',
    ownerId: reference.workId,
    originalName: reference.originalName,
    mimeType: reference.mimeType,
    size: reference.size,
    metadata: {
      category: 'work-item-photo',
      tenantId: reference.tenantId,
      formItemId: reference.workItemId,
      clientPhotoId: reference.id,
      capturedAt: reference.createdAt,
    },
    createdAt: reference.createdAt ?? '',
    updatedAt: reference.updatedAt ?? '',
  };
}
