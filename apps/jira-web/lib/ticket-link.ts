export interface TicketLink {
  workspaceId: string
  projectId: string
  ticketId: string
  commentId: string
}

// Links select only resources already returned by the authenticated API.
export function parseTicketLink(search: string): TicketLink | null {
  const params = new URLSearchParams(search)
  const ids = ['workspaceId', 'projectId', 'ticketId', 'commentId'] as const
  const link = {} as TicketLink
  for (const key of ids) {
    const value = params.get(key)
    if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null
    link[key] = value.toLowerCase()
  }
  return link
}
