import { Gauge } from 'lucide-react'
import { getSprintCapacity, getSprintPointTotals } from '@/lib/sprint-capacity'
import { cn } from '@/lib/utils'
import type { ApiSprint, ApiTicket } from '@/types/project'

export function SprintPoints({ sprint, tickets }: { sprint: ApiSprint; tickets: ApiTicket[] }) {
  const { planned, completed, unestimated } = getSprintPointTotals(sprint, tickets)
  const { weekdays, points: capacity } = getSprintCapacity(sprint.startDate, sprint.endDate, sprint.weeklyCapacityPoints)
  const pending = planned - completed
  const balance = capacity === null ? null : capacity - planned
  const overCapacity = balance !== null && balance < 0
  const scale = Math.max(capacity ?? 0, planned, 1)

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <Gauge aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Puntos del sprint</h3>
        </div>
        <div className="text-sm font-semibold tabular-nums">
          {capacity === null ? `${planned} pts planificados` : `${planned} / ${capacity} pts de capacidad`}
        </div>
      </div>

      <div aria-hidden="true" className="relative flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-success transition-[width]" style={{ width: `${completed / scale * 100}%` }} />
        <div className="bg-primary transition-[width]" style={{ width: `${pending / scale * 100}%` }} />
        {overCapacity && (
          <div className="absolute inset-y-0 right-0 border-l-2 border-destructive bg-destructive/25"
            style={{ width: `${-balance / scale * 100}%` }} />
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />{completed} pts completados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-primary" />{pending} pts pendientes
          </span>
          {unestimated > 0 && <span>{unestimated} sin estimar</span>}
        </div>
        <span className={cn(balance !== null && 'font-medium', overCapacity && 'text-destructive')}>
          {balance === null
            ? sprint.weeklyCapacityPoints == null ? 'Capacidad sin configurar' : 'Capacidad pendiente de fechas'
            : overCapacity ? `${-balance} pts sobre la capacidad` : `${balance} pts disponibles`}
        </span>
      </div>
      {weekdays !== null && <p className="text-xs text-muted-foreground">
        {weekdays} {weekdays === 1 ? 'día hábil' : 'días hábiles'}
        {sprint.weeklyCapacityPoints != null && ` · ${sprint.weeklyCapacityPoints} pts por semana`}
      </p>}
    </div>
  )
}
