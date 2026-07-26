import type { ApiTicket } from '@/types/project'
import { authenticatedFetch } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    const message = Array.isArray(body.message) ? body.message[0] : body.message
    throw new Error(message ?? `HTTP error! status: ${res.status}`)
  }
  return res.json()
}

export async function getTicketsByProject(projectId: string): Promise<ApiTicket[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tickets`, { cache: 'no-store' })
  return handleResponse<ApiTicket[]>(res)
}

export async function createTicket(projectId: string, data: {
  title: string
  description?: string
  status?: string
  priority?: string
  type?: string
  sprintId?: string | null
  assigneeId?: string | null
  storyPoints?: number | null
  dueDate?: string | null
}): Promise<ApiTicket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiTicket>(res)
}

export async function updateTicket(projectId: string, ticketId: string, data: Partial<{
  title: string
  description: string
  status: string
  priority: string
  type: string
  sprintId: string | null
  assigneeId: string | null
  storyPoints: number | null
  dueDate: string | null
}>): Promise<ApiTicket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiTicket>(res)
}

export async function deleteTicket(projectId: string, ticketId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tickets/${ticketId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
}
