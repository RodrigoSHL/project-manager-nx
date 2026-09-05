'use client'

import * as React from 'react'
import { Calendar, Target, TrendingUp, CheckCircle2, Clock, Users, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ApiTicket, ApiSprint } from '@/types/project'

interface SprintInfoProps {
  sprint: ApiSprint
  tickets: ApiTicket[]
  onEdit?: () => void
}

export function SprintInfo({ sprint, tickets, onEdit }: SprintInfoProps) {
  const totalTickets = tickets.length
  const doneTickets = tickets.filter(t => t.status === 'done').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress' || t.status === 'in_review').length
  const totalStoryPoints = tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)
  const completedStoryPoints = tickets
    .filter(t => t.status === 'done')
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0)

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Sprint Header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold">{sprint.name}</h2>
            <Badge variant="outline" className="text-xs font-normal gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Activo
            </Badge>
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {remainingDays} días restantes
            </div>
          </div>

          {sprint.goal && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{sprint.goal}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Story Points */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Story Points</span>
              <span className="font-semibold">{completedStoryPoints}/{totalStoryPoints}</span>
            </div>
            <Progress 
              value={totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0} 
              className="h-2" 
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {totalStoryPoints - completedStoryPoints} pendientes
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
                : 'Sprint finalizado'
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
    </Card>
  )
}
