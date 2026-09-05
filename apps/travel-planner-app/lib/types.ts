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
  price?: string
  priceCurrency?: string
  priceType?: 'per_person' | 'total'
  financialStatus?: 'estimated' | 'reserved' | 'partial' | 'paid'
  financialParticipantUserIds?: string[]
  financialPayerUserId?: string
  paidAt?: string
  paymentReferenceUrl?: string
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
  flight:        { bg: 'bg-sky-100 dark:bg-sky-950/80',       text: 'text-sky-800 dark:text-sky-200',       border: 'border-sky-300 dark:border-sky-800' },
  train:         { bg: 'bg-violet-100 dark:bg-violet-950/80', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-800' },
  bus:           { bg: 'bg-indigo-100 dark:bg-indigo-950/80', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-800' },
  transfer:      { bg: 'bg-blue-100 dark:bg-blue-950/80',     text: 'text-blue-800 dark:text-blue-200',     border: 'border-blue-300 dark:border-blue-800' },
  accommodation: { bg: 'bg-amber-100 dark:bg-amber-950/80',   text: 'text-amber-800 dark:text-amber-200',   border: 'border-amber-300 dark:border-amber-800' },
  sightseeing:   { bg: 'bg-emerald-100 dark:bg-emerald-950/80', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-800' },
  food:          { bg: 'bg-orange-100 dark:bg-orange-950/80', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-800' },
  shopping:      { bg: 'bg-pink-100 dark:bg-pink-950/80',     text: 'text-pink-800 dark:text-pink-200',     border: 'border-pink-300 dark:border-pink-800' },
  document:      { bg: 'bg-red-100 dark:bg-red-950/80',       text: 'text-red-800 dark:text-red-200',       border: 'border-red-300 dark:border-red-800' },
  reminder:      { bg: 'bg-yellow-100 dark:bg-yellow-950/80', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-800' },
  free:          { bg: 'bg-teal-100 dark:bg-teal-950/80',     text: 'text-teal-800 dark:text-teal-200',     border: 'border-teal-300 dark:border-teal-800' },
  other:         { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-700 dark:text-gray-200',     border: 'border-gray-300 dark:border-gray-700' },
}

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  reserved: 'Reservado',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<ActivityStatus, { bg: string; text: string }> = {
  pending:   { bg: 'bg-yellow-100 dark:bg-yellow-950/80', text: 'text-yellow-800 dark:text-yellow-200' },
  confirmed: { bg: 'bg-green-100 dark:bg-green-950/80',   text: 'text-green-800 dark:text-green-200' },
  reserved:  { bg: 'bg-blue-100 dark:bg-blue-950/80',     text: 'text-blue-800 dark:text-blue-200' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-950/80',       text: 'text-red-700 dark:text-red-200' },
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
