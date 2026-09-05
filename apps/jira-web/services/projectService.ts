import type { ApiProject, ApiTeamMember } from '@/types/project'
import { authenticatedFetch } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export async function getProjects(): Promise<ApiProject[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`)
  return res.json()
}

export async function getProjectsByWorkspace(workspaceId: string): Promise<ApiProject[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`)
  return res.json()
}

export async function getProjectTeamMembers(projectId: string): Promise<ApiTeamMember[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching project: ${res.status}`)
  const project = await res.json()
  return project.teamMembers ?? []
}
