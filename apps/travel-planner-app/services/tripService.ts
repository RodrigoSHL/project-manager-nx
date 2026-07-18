import { getAuthHeaders } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export interface Trip {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
}

export type CreateTripData = Pick<Trip, 'title' | 'description' | 'startDate' | 'endDate' | 'coverImage'>

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  return handleResponse<Trip[]>(res)
}

export async function getTrip(tripId: string): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  return handleResponse<Trip>(res)
}

export async function createTrip(data: CreateTripData): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<Trip>(res)
}

export async function updateTrip(tripId: string, data: Partial<CreateTripData>): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<Trip>(res)
}

export async function deleteTrip(tripId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
}
