import { getAuthHeaders } from '@/lib/auth';

const FILES_URL = '/api/storage/files';

export interface ActivityPhoto {
  id: string;
  application: string;
  ownerType: string | null;
  ownerId: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  checksumSha256: string;
  storageProvider: string;
  metadata: { tripId?: string; category?: string; caption?: string; sortOrder?: number; [key: string]: unknown } | null;
  createdAt: string;
  updatedAt: string;
}

async function checked<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.message === 'string' ? body.message : fallback);
  }
  return response.status === 204 ? undefined as T : response.json();
}

export async function uploadActivityPhoto(file: File, activityId: string, tripId: string, metadata?: { caption?: string; sortOrder?: number }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('application', 'travel-planner-app');
  formData.append('ownerType', 'activity');
  formData.append('ownerId', activityId);
  formData.append('metadata', JSON.stringify({ tripId, category: 'activity-photo', ...metadata }));
  return checked<ActivityPhoto>(await fetch(FILES_URL, { method: 'POST', credentials: 'include', headers: getAuthHeaders(), body: formData }), 'No fue posible subir la fotografía');
}

export async function listActivityPhotos(activityId: string) {
  const query = new URLSearchParams({ application: 'travel-planner-app', ownerType: 'activity', ownerId: activityId });
  return checked<ActivityPhoto[]>(await fetch(`${FILES_URL}?${query}`, { credentials: 'include', headers: getAuthHeaders(), cache: 'no-store' }), 'No fue posible cargar las fotografías');
}

export async function getActivityPhoto(id: string) {
  return checked<ActivityPhoto>(await fetch(`${FILES_URL}/${id}`, { credentials: 'include', headers: getAuthHeaders() }), 'No fue posible cargar la fotografía');
}

export async function deleteActivityPhoto(id: string) {
  return checked<void>(await fetch(`${FILES_URL}/${id}`, { method: 'DELETE', credentials: 'include', headers: getAuthHeaders() }), 'No fue posible eliminar la fotografía');
}

export async function getActivityPhotoContent(id: string) {
  const response = await fetch(`${FILES_URL}/${id}/content`, { credentials: 'include', headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No fue posible descargar la fotografía');
  return response.blob();
}
