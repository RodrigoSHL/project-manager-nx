import type { ApiProject, ApiTeamMember } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export async function getProjects(): Promise<ApiProject[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`)
  return res.json()
}

export async function getProjectsByWorkspace(workspaceId: string): Promise<ApiProject[]> {
  const res = await fetch(`${API_BASE_URL}/projects?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`)
  return res.json()
}

export async function getProjectTeamMembers(projectId: string): Promise<ApiTeamMember[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching project: ${res.status}`)
  const project = await res.json()
  return project.teamMembers ?? []
}
