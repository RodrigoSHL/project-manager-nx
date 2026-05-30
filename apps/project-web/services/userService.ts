const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
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
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export const UserService = {
  getAll: (): Promise<User[]> =>
    fetch(`${API_BASE_URL}/users`).then(handleResponse<User[]>),

  getOne: (id: string): Promise<User> =>
    fetch(`${API_BASE_URL}/users/${id}`).then(handleResponse<User>),

  create: (dto: CreateUserDto): Promise<User> =>
    fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<User>),

  update: (id: string, dto: Partial<CreateUserDto>): Promise<User> =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<User>),

  remove: (id: string): Promise<void> =>
    fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }).then(handleResponse<void>),
};

// ── Workspaces ────────────────────────────────────────────────────────────

export const WorkspaceService = {
  getAll: (): Promise<Workspace[]> =>
    fetch(`${API_BASE_URL}/workspaces`).then(handleResponse<Workspace[]>),

  getOne: (id: string): Promise<Workspace> =>
    fetch(`${API_BASE_URL}/workspaces/${id}`).then(handleResponse<Workspace>),

  create: (dto: CreateWorkspaceDto): Promise<Workspace> =>
    fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<Workspace>),

  update: (id: string, dto: Partial<CreateWorkspaceDto>): Promise<Workspace> =>
    fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<Workspace>),

  remove: (id: string): Promise<void> =>
    fetch(`${API_BASE_URL}/workspaces/${id}`, { method: 'DELETE' }).then(handleResponse<void>),

  // Members
  getMembers: (workspaceId: string): Promise<WorkspaceMember[]> =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`).then(handleResponse<WorkspaceMember[]>),

  addMember: (workspaceId: string, dto: AddMemberDto): Promise<WorkspaceMember> =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }).then(handleResponse<WorkspaceMember>),

  updateMemberRole: (workspaceId: string, userId: string, role: string): Promise<WorkspaceMember> =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }).then(handleResponse<WorkspaceMember>),

  removeMember: (workspaceId: string, userId: string): Promise<void> =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    }).then(handleResponse<void>),
};
