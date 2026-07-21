import { getAuthHeaders } from '@/lib/auth'
import type { Activity } from '@/lib/types'

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

export async function getActivities(tripId: string): Promise<Activity[]> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  return handleResponse<Activity[]>(res)
}

export async function createActivity(tripId: string, data: Omit<Activity, 'id'>): Promise<Activity> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<Activity>(res)
}

export async function updateActivity(tripId: string, activityId: string, data: Partial<Omit<Activity, 'id'>>): Promise<Activity> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities/${activityId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<Activity>(res)
}

export async function deleteActivity(tripId: string, activityId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities/${activityId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
}
