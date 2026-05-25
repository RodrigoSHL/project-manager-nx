const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
  user?: User
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const WorkspaceService = {
  getAll: (): Promise<Workspace[]> =>
    fetch(`${API_BASE_URL}/workspaces`).then(r => handleResponse<Workspace[]>(r)),

  getOne: (id: string): Promise<Workspace> =>
    fetch(`${API_BASE_URL}/workspaces/${id}`).then(r => handleResponse<Workspace>(r)),

  getMembers: (workspaceId: string): Promise<WorkspaceMember[]> =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`).then(r => handleResponse<WorkspaceMember[]>(r)),
}
