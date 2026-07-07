'use client'

import { Activity, TravelDay, Filters, COUNTRIES } from '@/lib/types'
import { ActivityCard } from './ActivityCard'
import { cn } from '@/lib/utils'
import { format, parseISO, compareAsc } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ArrowRight, MapPin } from 'lucide-react'

interface Props {
  activities: Activity[]
  travelDays: TravelDay[]
  filters: Filters
  onAddActivity: (date: string) => void
  onEditActivity: (activity: Activity) => void
  onDeleteActivity: (id: string) => void
  onDuplicateActivity: (id: string) => void
}

function getCountryFlag(name: string) {
  return COUNTRIES.find(c => c.name === name)?.flag ?? ''
}

function applyFilters(activities: Activity[], filters: Filters): Activity[] {
  return activities.filter(a => {
    if (filters.country && !a.countries.includes(filters.country)) return false
    if (filters.type && a.type !== filters.type) return false
    if (filters.status && a.status !== filters.status) return false
    if (filters.priority && a.priority !== filters.priority) return false
    return true
  })
}

export function ItineraryList({ activities, travelDays, filters, onAddActivity, onEditActivity, onDeleteActivity, onDuplicateActivity }: Props) {
  const filtered = applyFilters(activities, filters)

  // Group by date
  const byDate = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  // Merge with travelDays that have no activities so we still see empty trip days
  travelDays.forEach(td => {
    if (!byDate[td.date]) byDate[td.date] = []
  })

  const sortedDates = Object.keys(byDate).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-base">Sin actividades para mostrar</p>
        <p className="text-sm mt-1">Ajusta los filtros o agrega nuevas actividades.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {sortedDates.map(dateStr => {
        const travelDay = travelDays.find(d => d.date === dateStr)
        const dateActivities = (byDate[dateStr] ?? []).sort((a, b) =>
          (a.startTime || '23:59').localeCompare(b.startTime || '23:59')
        )
        const countries = travelDay?.countries ?? [...new Set(dateActivities.flatMap(a => a.countries))]
        const dateObj = parseISO(dateStr)

        return (
          <div key={dateStr} className="flex gap-4">
            {/* Date column */}
            <div className="hidden sm:flex flex-col items-center w-16 shrink-0">
              <div className="flex flex-col items-center bg-card border border-border rounded-xl p-2 text-center w-full">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {format(dateObj, 'EEE', { locale: es })}
                </span>
                <span className="text-2xl font-bold text-foreground leading-tight">
                  {format(dateObj, 'd')}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(dateObj, 'MMM', { locale: es })}
                </span>
              </div>
              {/* Connecting line */}
              <div className="flex-1 w-px bg-border mt-1" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-3 pb-4">
              {/* Day header */}
              <div className="flex items-center gap-3">
                <div className="sm:hidden flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {format(dateObj, 'EEEE d', { locale: es })}
                  </span>
                </div>

                {/* Countries */}
                {countries.length > 0 && (
                  <div className={cn(
                    'flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full',
                    countries.length > 1
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800',
                  )}>
                    {countries.length === 1 ? (
                      <span>{getCountryFlag(countries[0])} {countries[0]}</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>{getCountryFlag(countries[0])} {countries[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>{getCountryFlag(countries[countries.length - 1])} {countries[countries.length - 1]}</span>
                      </span>
                    )}
                  </div>
                )}

                {travelDay?.mainCity && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {travelDay.mainCity}
                  </span>
                )}
              </div>

              {/* Activities */}
              {dateActivities.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {dateActivities.map(a => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onEdit={onEditActivity}
                      onDelete={onDeleteActivity}
                      onDuplicate={onDuplicateActivity}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin actividades este día</p>
              )}

              {/* Add button */}
              <button
                onClick={() => onAddActivity(dateStr)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar actividad
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
