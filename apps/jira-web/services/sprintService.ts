import type { ApiSprint } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

export async function getSprintsByProject(projectId: string): Promise<ApiSprint[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints`, { cache: 'no-store' })
  return handleResponse<ApiSprint[]>(res)
}

export async function createSprint(projectId: string, data: {
  name: string
  goal?: string
  startDate?: string
  endDate?: string
}): Promise<ApiSprint> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiSprint>(res)
}

export async function updateSprint(projectId: string, sprintId: string, data: Partial<{
  name: string
  goal: string
  startDate: string
  endDate: string
}>): Promise<ApiSprint> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints/${sprintId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiSprint>(res)
}

export async function activateSprint(projectId: string, sprintId: string): Promise<ApiSprint> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints/${sprintId}/activate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse<ApiSprint>(res)
}

export async function deleteSprint(projectId: string, sprintId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints/${sprintId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
}
