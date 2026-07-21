import type { ApiSupportDetail } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

function supportDetailUrl(projectId: string, ticketId: string): string {
  return `${API_BASE_URL}/projects/${projectId}/tickets/${ticketId}/support-detail`
}

export async function getSupportDetail(
  projectId: string,
  ticketId: string,
): Promise<ApiSupportDetail> {
  const res = await fetch(supportDetailUrl(projectId, ticketId))
  return handleResponse<ApiSupportDetail>(res)
}

export async function updateSupportDetail(
  projectId: string,
  ticketId: string,
  data: Partial<Omit<ApiSupportDetail, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>>,
): Promise<ApiSupportDetail> {
  const res = await fetch(supportDetailUrl(projectId, ticketId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiSupportDetail>(res)
}

export async function createSupportDetail(
  projectId: string,
  ticketId: string,
  data: Partial<Omit<ApiSupportDetail, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>> = {},
): Promise<ApiSupportDetail> {
  const res = await fetch(supportDetailUrl(projectId, ticketId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<ApiSupportDetail>(res)
}

export async function deleteSupportDetail(
  projectId: string,
  ticketId: string,
): Promise<void> {
  const res = await fetch(supportDetailUrl(projectId, ticketId), { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || res.statusText)
  }
}
