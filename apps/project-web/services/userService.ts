import { authenticatedFetch } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  roles: UserRole[];
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  user?: User;
}

export interface AddMemberDto {
  userId: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(error.message) ? error.message[0] : error.message;
    throw new Error(message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export const UserService = {
  getAll: (): Promise<User[]> =>
    authenticatedFetch(`${API_BASE_URL}/users`, { cache: 'no-store' }).then(handleResponse<User[]>),

  getOne: (id: string): Promise<User> =>
    authenticatedFetch(`${API_BASE_URL}/users/${id}`, { cache: 'no-store' }).then(handleResponse<User>),

  create: (dto: CreateUserDto): Promise<User> =>
    authenticatedFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<User>),

  update: (id: string, dto: Partial<CreateUserDto>): Promise<User> =>
    authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<User>),

  remove: (id: string): Promise<void> =>
    authenticatedFetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }).then(handleResponse<void>),
};

// ── Workspaces ────────────────────────────────────────────────────────────

export const WorkspaceService = {
  getAll: (): Promise<Workspace[]> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces`, { cache: 'no-store' }).then(handleResponse<Workspace[]>),

  getOne: (id: string): Promise<Workspace> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${id}`, { cache: 'no-store' }).then(handleResponse<Workspace>),

  create: (dto: CreateWorkspaceDto): Promise<Workspace> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<Workspace>),

  update: (id: string, dto: Partial<CreateWorkspaceDto>): Promise<Workspace> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<Workspace>),

  remove: (id: string): Promise<void> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${id}`, { method: 'DELETE' }).then(handleResponse<void>),

  // Members
  getMembers: (workspaceId: string): Promise<WorkspaceMember[]> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`, { cache: 'no-store' }).then(handleResponse<WorkspaceMember[]>),

  addMember: (workspaceId: string, dto: AddMemberDto): Promise<WorkspaceMember> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<WorkspaceMember>),

  updateMemberRole: (workspaceId: string, userId: string, role: string): Promise<WorkspaceMember> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }).then(handleResponse<WorkspaceMember>),

  removeMember: (workspaceId: string, userId: string): Promise<void> =>
    authenticatedFetch(`${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    }).then(handleResponse<void>),
};
