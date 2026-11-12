'use client'

import * as React from 'react'
import { Calendar, Target, CheckCircle2, Clock, Users, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SprintPoints } from '@/components/sprint-points'
import { formatSprintDate } from '@/lib/sprint-capacity'
import type { ApiTicket, ApiSprint } from '@/types/project'

interface SprintInfoProps {
  sprint: ApiSprint
  tickets: ApiTicket[]
  onEdit?: () => void
  onComplete?: () => void
}

export function SprintInfo({ sprint, tickets, onEdit, onComplete }: SprintInfoProps) {
  const totalTickets = tickets.length
  const doneTickets = tickets.filter(t => t.status === 'done').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress' || t.status === 'in_review').length
  const progress = totalTickets > 0 ? (doneTickets / totalTickets) * 100 : 0

  const startDate = sprint.startDate ? new Date(sprint.startDate) : null
  const endDate = sprint.endDate ? new Date(sprint.endDate) : null
  const today = new Date()
  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const elapsedDays = startDate
    ? Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const timeProgress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0

  const assigneeCount = new Set(tickets.map(t => t.assigneeId).filter(Boolean)).size

  return (
    <Card className="p-5 mb-6 space-y-4 border-t-2 border-t-primary">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Sprint Header */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold">{sprint.name}</h2>
            <Badge variant="outline" className="text-xs font-normal gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Activo
            </Badge>
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" aria-label="Editar sprint" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onComplete && (
              <Button variant="outline" size="sm" onClick={onComplete}>
                Finalizar sprint
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatSprintDate(sprint.startDate) ?? 'Sin fecha'} – {formatSprintDate(sprint.endDate) ?? 'Sin fecha'}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {remainingDays} días restantes
            </div>
          </div>

          {sprint.goal && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent">
              <Target className="h-4 w-4 text-brand-foreground mt-0.5 shrink-0" />
              <p className="text-sm">{sprint.goal}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {doneTickets} done
              </span>
              <span>{inProgressTickets} in progress</span>
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tiempo</span>
              <span className="font-semibold">{elapsedDays}/{totalDays} días</span>
            </div>
            <Progress value={timeProgress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {remainingDays > 0 
                ? `${remainingDays} días para terminar`
                : 'Plazo del sprint terminado'
              }
            </div>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Equipo
            </div>
            <div className="text-xs text-muted-foreground">
              {assigneeCount} miembros activos
            </div>
          </div>
        </div>
      </div>
      <SprintPoints sprint={sprint} tickets={tickets} />
    </Card>
  )
}
