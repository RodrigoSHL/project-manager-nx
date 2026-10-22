import { authenticatedFetch } from '../auth/authenticated-fetch';
import type { WorkItemPhoto } from './models';

const filesUrl = '/api/storage/files';

export class PhotoNetworkError extends Error {}

export const MAX_WORK_PHOTO_SIZE = 10 * 1024 * 1024;
export const WORK_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export async function listWorkPhotos(tenantId: string, workId: string) {
  const query = new URLSearchParams({
    application: 'inspection-web',
    ownerType: 'work',
    ownerId: workId,
    tenantId,
  });
  return request<WorkItemPhoto[]>(`${filesUrl}?${query}`);
}

export async function uploadWorkPhoto(
  tenantId: string,
  workId: string,
  formItemId: string,
  file: File,
  offlineCapture?: { clientPhotoId: string; capturedAt: string }
) {
  if (file.size > MAX_WORK_PHOTO_SIZE) {
    throw new Error('La foto supera el límite de 10 MB.');
  }
  if (!WORK_PHOTO_ACCEPT.split(',').includes(file.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WebP.');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('application', 'inspection-web');
  form.append('ownerType', 'work');
  form.append('ownerId', workId);
  form.append(
    'metadata',
    JSON.stringify({
      category: 'work-item-photo',
      tenantId,
      formItemId,
      ...offlineCapture,
    })
  );
  return request<WorkItemPhoto>(filesUrl, { method: 'POST', body: form });
}

export async function loadWorkPhotoUrl(id: string) {
  return URL.createObjectURL(await loadWorkPhotoBlob(id));
}

export async function loadWorkPhotoBlob(id: string) {
  const response = await authenticatedFetch(
    `${filesUrl}/${encodeURIComponent(id)}/content`
  );
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'No se pudo cargar la foto.'));
  }
  return response.blob();
}

export async function deleteWorkPhoto(id: string) {
  await request(`${filesUrl}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function request<T = unknown>(url: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await authenticatedFetch(url, init);
  } catch {
    throw new PhotoNetworkError(
      'No fue posible conectar con el servidor de archivos.'
    );
  }
  if (!response.ok) {
    throw new Error(
      await errorMessage(response, 'No fue posible completar la operación.')
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (Array.isArray(body?.message)) return body.message[0] || fallback;
  return body?.message ?? fallback;
}
