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
  flight:        { bg: 'bg-accent',       text: 'text-brand-foreground',       border: 'border-primary/25' },
  train:         { bg: 'bg-accent', text: 'text-brand-foreground', border: 'border-primary/25' },
  bus:           { bg: 'bg-accent', text: 'text-brand-foreground', border: 'border-primary/25' },
  transfer:      { bg: 'bg-accent',     text: 'text-brand-foreground',     border: 'border-primary/25' },
  accommodation: { bg: 'bg-accent',   text: 'text-brand-foreground',   border: 'border-primary/25' },
  sightseeing:   { bg: 'bg-accent', text: 'text-brand-foreground', border: 'border-primary/25' },
  food:          { bg: 'bg-accent', text: 'text-brand-foreground', border: 'border-primary/25' },
  shopping:      { bg: 'bg-accent',     text: 'text-brand-foreground',     border: 'border-primary/25' },
  document:      { bg: 'bg-accent',       text: 'text-brand-foreground',       border: 'border-primary/25' },
  reminder:      { bg: 'bg-accent', text: 'text-brand-foreground', border: 'border-primary/25' },
  free:          { bg: 'bg-accent',     text: 'text-brand-foreground',     border: 'border-primary/25' },
  other:         { bg: 'bg-accent',        text: 'text-brand-foreground',     border: 'border-primary/25' },
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
