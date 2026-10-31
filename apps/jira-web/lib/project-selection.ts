const storageKey = (workspaceId: string) => `jira-web:projectId:${workspaceId}`

export function getSavedProjectId(workspaceId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(workspaceId))
  } catch {
    return null
  }
}

export function saveProjectId(workspaceId: string, projectId: string): void {
  try {
    if (projectId) window.localStorage.setItem(storageKey(workspaceId), projectId)
    else window.localStorage.removeItem(storageKey(workspaceId))
  } catch {
    // Project navigation still works if browser storage is unavailable.
  }
}
