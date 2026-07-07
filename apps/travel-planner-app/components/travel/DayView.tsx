'use client'

import { Activity, TravelDay, COUNTRIES } from '@/lib/types'
import { ActivityCard } from './ActivityCard'
import { cn } from '@/lib/utils'
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ArrowRight, MapPin } from 'lucide-react'

interface Props {
  currentDate: Date
  activities: Activity[]
  travelDays: TravelDay[]
  onAddActivity: (date: string) => void
  onEditActivity: (activity: Activity) => void
  onDeleteActivity: (id: string) => void
  onDuplicateActivity: (id: string) => void
}

function getCountryFlag(name: string) {
  return COUNTRIES.find(c => c.name === name)?.flag ?? ''
}

export function DayView({ currentDate, activities, travelDays, onAddActivity, onEditActivity, onDeleteActivity, onDuplicateActivity }: Props) {
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const dayActivities = activities
    .filter(a => a.date === dateStr)
    .sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'))

  const travelDay = travelDays.find(d => d.date === dateStr)
  const countries = travelDay?.countries ?? []
  const today = isToday(currentDate)

  // Separate by category
  const transport = dayActivities.filter(a => a.type === 'flight' || a.type === 'train' || a.type === 'bus' || a.type === 'transfer')
  const accommodation = dayActivities.filter(a => a.type === 'accommodation')
  const other = dayActivities.filter(a => !['flight', 'train', 'bus', 'transfer', 'accommodation'].includes(a.type))

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Day header */}
      <div className={cn(
        'rounded-2xl border p-6 text-center',
        today ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border',
      )}>
        <div className="text-sm font-medium uppercase tracking-widest opacity-70">
          {format(currentDate, 'EEEE', { locale: es })}
        </div>
        <div className="text-5xl font-bold mt-1">{format(currentDate, 'd')}</div>
        <div className="text-lg mt-1 opacity-80">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </div>

        {/* Countries */}
        {countries.length > 0 && (
          <div className={cn(
            'flex items-center justify-center gap-2 mt-3 font-medium',
            today ? 'text-primary-foreground' : 'text-foreground',
          )}>
            {countries.length === 1 ? (
              <span className="text-lg">{getCountryFlag(countries[0])} {countries[0]}</span>
            ) : (
              <span className="flex items-center gap-2 text-base">
                <span>{getCountryFlag(countries[0])} {countries[0]}</span>
                <ArrowRight className="w-4 h-4" />
                <span>{getCountryFlag(countries[countries.length - 1])} {countries[countries.length - 1]}</span>
              </span>
            )}
          </div>
        )}

        {travelDay?.mainCity && (
          <div className={cn(
            'flex items-center justify-center gap-1 mt-1.5 text-sm',
            today ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}>
            <MapPin className="w-3.5 h-3.5" />
            {travelDay.mainCity}
          </div>
        )}
      </div>

      {/* Transport section */}
      {transport.length > 0 && (
        <section aria-labelledby="transport-heading">
          <h2 id="transport-heading" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Traslados y vuelos
          </h2>
          <div className="flex flex-col gap-2">
            {transport.map(a => (
              <ActivityCard
                key={a.id}
                activity={a}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onDuplicate={onDuplicateActivity}
              />
            ))}
          </div>
        </section>
      )}

      {/* Accommodation section */}
      {accommodation.length > 0 && (
        <section aria-labelledby="accommodation-heading">
          <h2 id="accommodation-heading" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Alojamiento
          </h2>
          <div className="flex flex-col gap-2">
            {accommodation.map(a => (
              <ActivityCard
                key={a.id}
                activity={a}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onDuplicate={onDuplicateActivity}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other activities section */}
      {other.length > 0 && (
        <section aria-labelledby="activities-heading">
          <h2 id="activities-heading" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Actividades del día
          </h2>
          <div className="flex flex-col gap-2">
            {other.map(a => (
              <ActivityCard
                key={a.id}
                activity={a}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onDuplicate={onDuplicateActivity}
              />
            ))}
          </div>
        </section>
      )}

      {dayActivities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-base mb-2">Sin actividades para este día</p>
          <p className="text-sm">Haz clic en el botón de abajo para agregar una.</p>
        </div>
      )}

      <button
        onClick={() => onAddActivity(dateStr)}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary hover:text-primary py-4 text-sm text-muted-foreground transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar actividad
      </button>
    </div>
  )
}
