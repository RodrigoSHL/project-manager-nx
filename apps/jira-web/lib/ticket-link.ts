export interface ProjectLink {
  workspaceId: string
  projectId: string
}

export interface TicketLink extends ProjectLink {
  ticketId: string
  commentId: string
}

export function buildTicketPageHref(projectId: string, ticketId: string, commentId?: string): string {
  const path = `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`
  return commentId ? `${path}?${new URLSearchParams({ commentId })}` : path
}

export function buildProjectBoardHref(project: { id: string; workspaceId: string | null }): string {
  if (!project.workspaceId) return '/'
  return `/?${new URLSearchParams({ workspaceId: project.workspaceId, projectId: project.id })}`
}

export function parseProjectLink(search: string): ProjectLink | null {
  const params = new URLSearchParams(search)
  const workspaceId = params.get('workspaceId')
  const projectId = params.get('projectId')
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!workspaceId || !projectId || !uuid.test(workspaceId) || !uuid.test(projectId)) return null
  return { workspaceId: workspaceId.toLowerCase(), projectId: projectId.toLowerCase() }
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
