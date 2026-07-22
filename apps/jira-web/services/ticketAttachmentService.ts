import { authenticatedFetch } from '@/lib/api'
import type { ApiTicketAttachment } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'
const FILES_URL = `${API_BASE_URL}/storage/files`

export const MAX_TICKET_ATTACHMENT_SIZE = 10 * 1024 * 1024
export const TICKET_ATTACHMENT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.txt',
].join(',')

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  const message = body?.message
  if (Array.isArray(message)) return message[0] || fallback
  return typeof message === 'string' ? message : fallback
}

export async function listTicketAttachments(
  projectId: string,
  ticketId: string,
): Promise<ApiTicketAttachment[]> {
  const query = new URLSearchParams({
    application: 'jira-web',
    ownerType: 'ticket',
    ownerId: ticketId,
    projectId,
  })
  const response = await authenticatedFetch(`${FILES_URL}?${query}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(await errorMessage(response, 'No se pudieron cargar los archivos.'))
  return response.json() as Promise<ApiTicketAttachment[]>
}

export async function uploadTicketAttachment(
  projectId: string,
  ticketId: string,
  ticketKey: string,
  file: File,
): Promise<ApiTicketAttachment> {
  if (file.size > MAX_TICKET_ATTACHMENT_SIZE) {
    throw new Error('El archivo supera el límite de 10 MB.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('application', 'jira-web')
  form.append('ownerType', 'ticket')
  form.append('ownerId', ticketId)
  form.append('metadata', JSON.stringify({ projectId, ticketKey }))

  const response = await authenticatedFetch(FILES_URL, { method: 'POST', body: form })
  if (!response.ok) throw new Error(await errorMessage(response, 'No se pudo subir el archivo.'))
  return response.json() as Promise<ApiTicketAttachment>
}

export async function downloadTicketAttachment(id: string, filename: string): Promise<void> {
  const response = await authenticatedFetch(`${FILES_URL}/${encodeURIComponent(id)}/content`)
  if (!response.ok) throw new Error(await errorMessage(response, 'No se pudo descargar el archivo.'))

  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function deleteTicketAttachment(id: string): Promise<void> {
  const response = await authenticatedFetch(`${FILES_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await errorMessage(response, 'No se pudo eliminar el archivo.'))
}
