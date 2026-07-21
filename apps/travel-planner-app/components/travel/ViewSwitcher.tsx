'use client'

import { CalendarView } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays, CalendarRange, List } from 'lucide-react'

const VIEWS: { value: CalendarView; label: string; icon: React.ElementType }[] = [
  { value: 'month',     label: 'Mes',      icon: Calendar },
  { value: 'week',      label: 'Semana',   icon: CalendarRange },
  { value: 'day',       label: 'Día',      icon: CalendarDays },
  { value: 'itinerary', label: 'Itinerario', icon: List },
]

interface Props {
  current: CalendarView
  onChange: (view: CalendarView) => void
}

export function ViewSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="tablist" aria-label="Cambiar vista">
      {VIEWS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="tab"
          aria-selected={current === value}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            current === value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
