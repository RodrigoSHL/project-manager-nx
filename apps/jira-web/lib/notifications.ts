import { authenticatedFetch } from '@/lib/api'

const api = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export type NotificationFilter = 'all' | 'unread'

export interface JiraNotification {
  id: string
  projectId: string
  type: string
  title: string
  body: string
  createdAt: string
  readAt: string | null
  projectName?: string
  ticketKey?: string
  ticketId?: string
  commentId?: string
}

export interface JiraInbox {
  items: JiraNotification[]
  total: number
  unreadCount: number
}

export async function fetchInbox(
  status: NotificationFilter,
  page: number,
  limit: number,
  signal: AbortSignal
): Promise<JiraInbox> {
  const query = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  })
  const response = await authenticatedFetch(
    `${api}/jira/notifications?${query}`,
    { signal, cache: 'no-store' }
  )
  if (!response.ok) throw new Error('No se pudieron cargar tus notificaciones.')
  return response.json()
}

export async function markNotificationRead({
  projectId,
  id,
}: JiraNotification) {
  const response = await authenticatedFetch(
    `${api}/jira/notifications/${encodeURIComponent(
      projectId
    )}/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' }
  )
  if (!response.ok)
    throw new Error('No se pudo marcar la notificación como leída.')
}
