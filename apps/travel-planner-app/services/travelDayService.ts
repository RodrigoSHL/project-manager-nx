import { getAuthHeaders } from '@/lib/auth'
import type { TravelDay } from '@/lib/types'

// Keep browser requests same-origin. In development Next rewrites /api to the
// BFF; in production the reverse proxy routes /api to it.
const API_BASE_URL = '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    let message = `HTTP error! status: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message
      }
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message)
  }
  return res.json()
}

export async function getTravelDays(tripId: string): Promise<TravelDay[]> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  return handleResponse<TravelDay[]>(res)
}

export async function upsertTravelDay(tripId: string, date: string, data: TravelDay): Promise<TravelDay> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<TravelDay>(res)
}

export async function deleteTravelDay(tripId: string, date: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${date}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
}
