import { getAuthHeaders } from '@/lib/auth'

const API_BASE_URL = '/api'

export type LuggageType =
  | 'personal_backpack'
  | 'travel_backpack'
  | 'personal_bag'
  | 'duffel'
  | 'carry_on'
  | 'medium_suitcase'
  | 'large_suitcase'
  | 'checked_suitcase'
  | 'special'
  | 'custom'

export interface LuggageDimensions {
  height: number
  width: number
  depth: number
}

export interface Luggage {
  id: string
  ownerId: string
  name: string
  type: LuggageType
  image?: string | null
  color: string
  brand?: string | null
  model?: string | null
  capacityLiters?: number | null
  emptyWeight: number
  maxWeight?: number | null
  dimensions?: LuggageDimensions | null
  cabinCompatible: boolean
  personalItemCompatible: boolean
  checkedBaggage: boolean
  notes?: string | null
  archived: boolean
  tripAssignments?: { id: string; tripId: string }[]
}

export type LuggageInput = Omit<Luggage, 'id' | 'ownerId' | 'archived' | 'tripAssignments'>

export interface TripLuggage {
  id: string
  tripId: string
  luggageId: string
  ownerId: string
  luggage: Luggage
  actualWeight?: number | null
  occupancyLevel: 'empty' | 'low' | 'half' | 'almost_full' | 'full'
  maxWeightOverride?: number | null
  status: 'planned' | 'packing' | 'ready'
}

export type PackingCategory =
  | 'documents' | 'money' | 'tops' | 'bottoms' | 'underwear' | 'outerwear'
  | 'footwear' | 'hygiene' | 'health' | 'technology' | 'photography' | 'work'
  | 'sport' | 'beach' | 'accessories' | 'food' | 'safety' | 'entertainment'
  | 'shared' | 'shopping' | 'other'

export interface PackingItem {
  id: string
  tripId: string
  userId: string
  luggageId?: string | null
  name: string
  category: PackingCategory
  quantity: number
  haveIt: boolean
  packed: boolean
  purchaseRequired: boolean
  status: 'pending' | 'to_buy' | 'borrowed' | 'skipped' | 'deciding' | 'in_use' | 'equipped' | 'missing'
  priority: 'essential' | 'high' | 'normal' | 'optional'
  estimatedWeight: number
  actualWeight?: number | null
  packMoment: 'advance' | 'week_before' | 'day_before' | 'same_day' | 'before_leaving'
  shared: boolean
  private: boolean
  responsibleUserId?: string | null
  notes?: string | null
  source: string
  explanation?: string | null
  cabinPolicy: 'allowed' | 'not_recommended' | 'prohibited' | 'check_airline'
  checkedPolicy: 'allowed' | 'not_recommended' | 'prohibited' | 'check_airline'
}

export interface PackingDashboard {
  totals: {
    total: number
    haveIt: number
    packed: number
    toBuy: number
    unassigned: number
    beforeLeaving: number
  }
  luggage: Array<TripLuggage & {
    itemCount: number
    packedCount: number
    progress: number
    estimatedWeight: number
    maxWeight?: number | null
    warnings: string[]
  }>
  airlineNotice: string
}

export interface GeneratePackingInput {
  customDays?: number
  climate: 'hot' | 'mild' | 'cold' | 'rainy' | 'snow' | 'mixed' | 'unknown'
  activities: Array<'city' | 'beach' | 'hiking' | 'training' | 'running' | 'formal' | 'work' | 'snow' | 'camping' | 'photography' | 'nightlife' | 'driving'>
  laundryAccess: boolean
  laundryEveryDays?: number
  style: 'minimal' | 'balanced' | 'prepared'
  needsMedication?: boolean
  carriesLaptop?: boolean
  reserveShoppingSpace?: boolean
  replaceExisting?: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...init?.headers,
    },
  })
  if (response.status === 204) return undefined as T
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body?.message[0] : body?.message
    throw new Error(message || `No se pudo completar la solicitud (${response.status})`)
  }
  return response.json()
}

export const luggageApi = {
  list: () => request<Luggage[]>('/luggage'),
  create: (data: LuggageInput) => request<Luggage>('/luggage', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<LuggageInput>) => request<Luggage>(`/luggage/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  duplicate: (id: string) => request<Luggage>(`/luggage/${id}/duplicate`, { method: 'POST', body: '{}' }),
  archive: (id: string) => request<Luggage>(`/luggage/${id}/archive`, { method: 'POST', body: '{}' }),
  remove: (id: string) => request<void>(`/luggage/${id}`, { method: 'DELETE' }),
  listForTrip: (tripId: string) => request<TripLuggage[]>(`/trips/${tripId}/luggage`),
  addToTrip: (tripId: string, luggageId: string) => request<TripLuggage>(`/trips/${tripId}/luggage`, { method: 'POST', body: JSON.stringify({ luggageId }) }),
  removeFromTrip: (tripId: string, id: string) => request<void>(`/trips/${tripId}/luggage/${id}`, { method: 'DELETE' }),
  updateTripLuggage: (tripId: string, id: string, data: Partial<Pick<TripLuggage, 'actualWeight' | 'occupancyLevel' | 'maxWeightOverride' | 'status'>>) =>
    request<TripLuggage>(`/trips/${tripId}/luggage/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  listItems: (tripId: string) => request<PackingItem[]>(`/trips/${tripId}/packing`),
  dashboard: (tripId: string) => request<PackingDashboard>(`/trips/${tripId}/packing/dashboard`),
  generate: (tripId: string, data: GeneratePackingInput) => request<PackingItem[]>(`/trips/${tripId}/packing/generate`, { method: 'POST', body: JSON.stringify(data) }),
  createItem: (tripId: string, data: Partial<PackingItem> & Pick<PackingItem, 'name' | 'category'>) =>
    request<PackingItem>(`/trips/${tripId}/packing/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (tripId: string, id: string, data: Partial<PackingItem>) =>
    request<PackingItem>(`/trips/${tripId}/packing/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeItem: (tripId: string, id: string) => request<void>(`/trips/${tripId}/packing/items/${id}`, { method: 'DELETE' }),
}
