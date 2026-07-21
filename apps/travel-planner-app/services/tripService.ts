import { getAuthHeaders } from '@/lib/auth';

// Keep browser requests same-origin. Next proxies /api to the BFF in local
// development, while the production reverse proxy handles the same path.
const API_BASE_URL = '/api';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  baseCurrency?: string;
  createdAt: string;
  updatedAt: string;
  members?: TripMember[];
}

export type TripMemberRole = 'viewer' | 'editor';

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  createdAt: string;
  updatedAt: string;
}

export type CreateTripData = Pick<
  Trip,
  'title' | 'description' | 'startDate' | 'endDate' | 'coverImage'
>;

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;
    throw new Error(
      message
        ? `${message} (${res.status})`
        : `No se pudo completar la solicitud (${res.status})`
    );
  }
  return res.json();
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  return handleResponse<Trip[]>(res);
}

export async function getTrip(tripId: string): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  return handleResponse<Trip>(res);
}

export async function createTrip(data: CreateTripData): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<Trip>(res);
}

export async function updateTrip(
  tripId: string,
  data: Partial<CreateTripData>
): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<Trip>(res);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  return handleResponse<TripMember[]>(res);
}

export async function shareTrip(
  tripId: string,
  email: string,
  role: TripMemberRole
): Promise<TripMember> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify({ email, role }),
  });
  return handleResponse<TripMember>(res);
}

export async function updateTripMember(
  tripId: string,
  userId: string,
  role: TripMemberRole
): Promise<TripMember> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  return handleResponse<TripMember>(res);
}

export async function removeTripMember(
  tripId: string,
  userId: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  return handleResponse<UserProfile>(res);
}
