'use client'

import { Activity, TravelDay } from '@/lib/types'
import { CalendarDay } from './CalendarDay'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  currentDate: Date
  activities: Activity[]
  travelDays: TravelDay[]
  onAddActivity: (date: string) => void
  onSelectDay: (date: string) => void
  onEditActivity: (activity: Activity) => void
  onEditTravelDay: (date: string) => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function MonthView({ currentDate, activities, travelDays, onAddActivity, onSelectDay, onEditActivity, onEditTravelDay }: Props) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function getActivitiesForDate(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return activities.filter(a => a.date === dateStr).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  function getTravelDay(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return travelDays.find(d => d.date === dateStr)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          return (
            <CalendarDay
              key={dateStr}
              date={dateStr}
              activities={getActivitiesForDate(day)}
              travelDay={getTravelDay(day)}
              isCurrentMonth={isSameMonth(day, currentDate)}
              onAddActivity={onAddActivity}
              onSelectDay={onSelectDay}
              onEditActivity={onEditActivity}
              onEditTravelDay={onEditTravelDay}
            />
          )
        })}
      </div>
    </div>
  )
}
