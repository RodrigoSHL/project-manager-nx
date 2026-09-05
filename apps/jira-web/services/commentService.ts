import { authenticatedFetch } from '@/lib/api'
import type { ApiComment } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

function commentUrl(projectId: string, ticketId: string, commentId?: string): string {
  const base = `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/comments`
  return commentId ? `${base}/${encodeURIComponent(commentId)}` : base
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    const message = Array.isArray(error.message) ? error.message[0] : error.message
    throw new Error(message || `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getTicketComments(projectId: string, ticketId: string): Promise<ApiComment[]> {
  const response = await authenticatedFetch(commentUrl(projectId, ticketId), { cache: 'no-store' })
  return handleResponse<ApiComment[]>(response)
}

export async function createTicketComment(
  projectId: string,
  ticketId: string,
  body: string,
): Promise<ApiComment> {
  const response = await authenticatedFetch(commentUrl(projectId, ticketId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  return handleResponse<ApiComment>(response)
}

export async function updateTicketComment(
  projectId: string,
  ticketId: string,
  commentId: string,
  body: string,
): Promise<ApiComment> {
  const response = await authenticatedFetch(commentUrl(projectId, ticketId, commentId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  return handleResponse<ApiComment>(response)
}

export async function deleteTicketComment(
  projectId: string,
  ticketId: string,
  commentId: string,
): Promise<void> {
  const response = await authenticatedFetch(commentUrl(projectId, ticketId, commentId), {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
}
