'use client'

import { Activity, TravelDay, COUNTRIES } from '@/lib/types'
import { ActivityCard } from './ActivityCard'
import { cn } from '@/lib/utils'
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ArrowRight } from 'lucide-react'

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

export function WeekView({ currentDate, activities, travelDays, onAddActivity, onEditActivity, onDeleteActivity, onDuplicateActivity }: Props) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  function getActivitiesForDate(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return activities.filter(a => a.date === dateStr).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  function getTravelDay(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return travelDays.find(d => d.date === dateStr)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayActivities = getActivitiesForDate(day)
        const travelDay = getTravelDay(day)
        const countries = travelDay?.countries ?? []
        const today = isToday(day)

        return (
          <div key={dateStr} className={cn('flex flex-col gap-2', 'min-h-[200px]')}>
            {/* Day header */}
            <div className={cn(
              'rounded-lg border px-2 py-2 text-center',
              today ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border',
            )}>
              <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className="text-lg font-bold leading-tight">{format(day, 'd')}</div>
              {/* Countries */}
              {countries.length > 0 && (
                <div className={cn(
                  'flex items-center justify-center gap-0.5 text-[10px] mt-1',
                  today ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}>
                  {countries.length === 1 ? (
                    <span>{getCountryFlag(countries[0])}</span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      {getCountryFlag(countries[0])}
                      <ArrowRight className="w-2.5 h-2.5" />
                      {getCountryFlag(countries[countries.length - 1])}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="flex flex-col gap-1.5 flex-1">
              {dayActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onDuplicate={onDuplicateActivity}
                  compact
                />
              ))}
              <button
                onClick={() => onAddActivity(dateStr)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-lg border-2 border-dashed',
                  'border-border text-muted-foreground hover:border-primary hover:text-primary',
                  'py-2 text-xs transition-colors',
                  dayActivities.length === 0 && 'flex-1',
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
