'use client'

import { Activity, COUNTRIES } from '@/lib/types'
import { format, parseISO, isFuture, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plane, Train, Globe, Calendar, Zap } from 'lucide-react'

interface Props {
  activities: Activity[]
}

export function TripSummary({ activities }: Props) {
  if (activities.length === 0) return null

  const dates = [...new Set(activities.map(a => a.date))].sort()
  const totalDays = dates.length

  const countries = [...new Set(activities.flatMap(a => a.countries))].filter(Boolean)
  const totalCountries = countries.length

  const flights = activities.filter(a => a.type === 'flight').length
  const trains = activities.filter(a => a.type === 'train').length

  // Next upcoming activity
  const upcoming = activities
    .filter(a => {
      const d = parseISO(a.date)
      return (isFuture(d) || isToday(d)) && a.status !== 'cancelled'
    })
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return (a.startTime || '').localeCompare(b.startTime || '')
    })[0]

  const stats = [
    { icon: Calendar, label: 'Días de viaje', value: totalDays },
    { icon: Globe, label: 'Países', value: totalCountries },
    { icon: Plane, label: 'Vuelos', value: flights },
    { icon: Train, label: 'Trenes', value: trains },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground leading-tight">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Countries visited */}
      {countries.length > 0 && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Países:</span>
          {countries.map(name => {
            const country = COUNTRIES.find(c => c.name === name)
            return (
              <span key={name} className="flex items-center gap-1 text-sm font-medium text-foreground">
                <span>{country?.flag}</span>
                <span>{name}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Next activity */}
      {upcoming && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Próxima actividad</div>
            <div className="text-sm font-medium text-foreground truncate">{upcoming.title}</div>
            <div className="text-xs text-muted-foreground">
              {format(parseISO(upcoming.date), "EEEE d 'de' MMMM", { locale: es })}
              {upcoming.startTime && ` · ${upcoming.startTime}`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
