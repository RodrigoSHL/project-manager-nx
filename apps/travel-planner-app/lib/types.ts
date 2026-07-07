export type ActivityType =
  | 'flight'
  | 'train'
  | 'bus'
  | 'transfer'
  | 'accommodation'
  | 'sightseeing'
  | 'food'
  | 'shopping'
  | 'document'
  | 'reminder'
  | 'free'
  | 'other'

export type ActivityStatus = 'pending' | 'confirmed' | 'reserved' | 'cancelled'
export type ActivityPriority = 'low' | 'medium' | 'high'
export type CalendarView = 'month' | 'week' | 'day' | 'itinerary'

export interface Activity {
  id: string
  title: string
  type: ActivityType
  date: string // ISO date string 'YYYY-MM-DD'
  startTime?: string // 'HH:mm'
  endTime?: string // 'HH:mm'
  countries: string[] // country codes or names
  originCountry?: string
  destinationCountry?: string
  city?: string
  location?: string
  description?: string
  status: ActivityStatus
  priority: ActivityPriority
  link?: string
}

export interface TravelDay {
  date: string // 'YYYY-MM-DD'
  countries: string[]
  mainCity?: string
  notes?: string
}

export interface TravelStore {
  activities: Activity[]
  travelDays: TravelDay[]
}

export interface Filters {
  country: string
  type: ActivityType | ''
  status: ActivityStatus | ''
  priority: ActivityPriority | ''
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  flight: 'Vuelo',
  train: 'Tren',
  bus: 'Bus',
  transfer: 'Traslado local',
  accommodation: 'Alojamiento',
  sightseeing: 'Actividad turística',
  food: 'Comida / restaurante',
  shopping: 'Compra pendiente',
  document: 'Documento / trámite',
  reminder: 'Recordatorio',
  free: 'Tiempo libre',
  other: 'Otro',
}

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, { bg: string; text: string; border: string }> = {
  flight:        { bg: 'bg-sky-100',    text: 'text-sky-800',    border: 'border-sky-300' },
  train:         { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  bus:           { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  transfer:      { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  accommodation: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  sightseeing:   { bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300' },
  food:          { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  shopping:      { bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-300' },
  document:      { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  reminder:      { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  free:          { bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-300' },
  other:         { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300' },
}

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  reserved: 'Reservado',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<ActivityStatus, { bg: string; text: string }> = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-green-100',  text: 'text-green-800' },
  reserved:  { bg: 'bg-blue-100',   text: 'text-blue-800' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700' },
}

export const PRIORITY_LABELS: Record<ActivityPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export const COUNTRIES = [
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'CH', name: 'Suiza', flag: '🇨🇭' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'GR', name: 'Grecia', flag: '🇬🇷' },
  { code: 'CZ', name: 'República Checa', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungría', flag: '🇭🇺' },
  { code: 'PL', name: 'Polonia', flag: '🇵🇱' },
  { code: 'HR', name: 'Croacia', flag: '🇭🇷' },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴' },
  { code: 'SE', name: 'Suecia', flag: '🇸🇪' },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  { code: 'SC', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
]
