"use client"

import * as React from "react"
import { WorkspaceService, type Workspace } from "@/services/userService"

interface WorkspaceContextValue {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  setSelectedWorkspace: (ws: Workspace | null) => void
  loading: boolean
  reload: () => void
}

const WorkspaceContext = React.createContext<WorkspaceContextValue>({
  workspaces: [],
  selectedWorkspace: null,
  setSelectedWorkspace: () => undefined,
  loading: true,
  reload: () => undefined,
})

const STORAGE_KEY = "project-web:workspaceId"

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspaceState] = React.useState<Workspace | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await WorkspaceService.getAll()
      setWorkspaces(data)

      // Restaurar workspace guardado o seleccionar el primero
      const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      const saved = savedId ? data.find(w => w.id === savedId) : null
      setSelectedWorkspaceState(saved ?? data[0] ?? null)
    } catch {
      // sin workspaces disponibles
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const setSelectedWorkspace = React.useCallback((ws: Workspace | null) => {
    setSelectedWorkspaceState(ws)
    if (typeof window !== "undefined") {
      if (ws) localStorage.setItem(STORAGE_KEY, ws.id)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return (
    <WorkspaceContext.Provider value={{ workspaces, selectedWorkspace, setSelectedWorkspace, loading, reload: load }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return React.useContext(WorkspaceContext)
}
