import type { ApiProject } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export async function getProjects(): Promise<ApiProject[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`)
  return res.json()
}
