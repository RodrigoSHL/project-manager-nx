import { authenticatedFetch } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

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
    authenticatedFetch(`${API_BASE_URL}/workspaces`).then(r => handleResponse<Workspace[]>(r)),

  getOne: (id: string): Promise<Workspace> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${id}`).then(r => handleResponse<Workspace>(r)),

  getMembers: (workspaceId: string): Promise<WorkspaceMember[]> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`).then(r => handleResponse<WorkspaceMember[]>(r)),
}
