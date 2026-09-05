"use client"

import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
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
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspaceState] = React.useState<Workspace | null>(null)
  const [loading, setLoading] = React.useState(true)
  const storageKey = `${STORAGE_KEY}:${user.userId}`

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await WorkspaceService.getAll()
      setWorkspaces(data)

      // Restaurar workspace guardado o seleccionar el primero
      const savedId = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
      const saved = savedId ? data.find(w => w.id === savedId) : null
      setSelectedWorkspaceState(saved ?? data[0] ?? null)
    } catch {
      setWorkspaces([])
      setSelectedWorkspaceState(null)
    } finally {
      setLoading(false)
    }
  }, [storageKey])

  React.useEffect(() => { load() }, [load])

  const setSelectedWorkspace = React.useCallback((ws: Workspace | null) => {
    setSelectedWorkspaceState(ws)
    if (typeof window !== "undefined") {
      if (ws) localStorage.setItem(storageKey, ws.id)
      else localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return (
    <WorkspaceContext.Provider value={{ workspaces, selectedWorkspace, setSelectedWorkspace, loading, reload: load }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return React.useContext(WorkspaceContext)
}
