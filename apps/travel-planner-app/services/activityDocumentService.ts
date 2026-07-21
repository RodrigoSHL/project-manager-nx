import { getAuthHeaders } from '@/lib/auth'
import type { ActivityPhoto } from './activityPhotoService'

const FILES_URL = '/api/storage/files'
export type ActivityDocument = ActivityPhoto
export type ActivityDocumentType = 'reservation-receipt' | 'other'

async function checked<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.message === 'string' ? body.message : fallback)
  }
  return response.status === 204 ? undefined as T : response.json()
}

export async function uploadActivityDocument(file: File, activityId: string, tripId: string, documentType: ActivityDocumentType) {
  const form = new FormData()
  form.append('file', file)
  form.append('application', 'travel-planner-app')
  form.append('ownerType', 'activity')
  form.append('ownerId', activityId)
  form.append('metadata', JSON.stringify({ tripId, category: 'activity-document', documentType }))
  return checked<ActivityDocument>(await fetch(FILES_URL, { method: 'POST', credentials: 'include', headers: getAuthHeaders(), body: form }), 'No fue posible subir el documento')
}

export async function listActivityDocuments(activityId: string) {
  const query = new URLSearchParams({ application: 'travel-planner-app', ownerType: 'activity', ownerId: activityId, category: 'activity-document' })
  return checked<ActivityDocument[]>(await fetch(`${FILES_URL}?${query}`, { credentials: 'include', headers: getAuthHeaders(), cache: 'no-store' }), 'No fue posible cargar los documentos')
}

export async function deleteActivityDocument(id: string) {
  return checked<void>(await fetch(`${FILES_URL}/${id}`, { method: 'DELETE', credentials: 'include', headers: getAuthHeaders() }), 'No fue posible eliminar el documento')
}

export async function downloadActivityDocument(id: string, filename: string) {
  const response = await fetch(`${FILES_URL}/${id}/content`, { credentials: 'include', headers: getAuthHeaders() })
  if (!response.ok) throw new Error('No fue posible descargar el documento')
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
