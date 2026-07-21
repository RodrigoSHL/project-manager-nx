'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronRight,
  Zap,
  Layers,
  Plus,
  Target,
  Calendar,
  CheckSquare,
  Bug,
  BookOpen,
  LifeBuoy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { typeConfig } from '@/lib/mock-data'
import type { ApiTicket, ApiSprint } from '@/types/project'

interface BacklogViewProps {
  tickets: ApiTicket[]
  sprints: ApiSprint[]
  currentProject: string
  onTicketClick: (ticket: ApiTicket) => void
  onCreateTicket: (sprintId?: string | null) => void
}

export function BacklogView({
  tickets,
  sprints,
  currentProject,
  onTicketClick,
  onCreateTicket,
}: BacklogViewProps) {
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >({
    backlog: true,
  })

  const projectSprints = sprints
    .filter((s) => s.projectId === currentProject)
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })
  const backlogTickets = tickets.filter(
    (t) => !t.sprintId || t.status === 'backlog'
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getSprintTickets = (sprintId: string) =>
    tickets.filter((t) => t.sprintId === sprintId && t.status !== 'backlog')

  const getSprintStats = (sprintTickets: ApiTicket[]) => {
    const doneTickets = sprintTickets.filter((t) => t.status === 'done')
    const totalStoryPoints = sprintTickets.reduce(
      (acc, t) => acc + (t.storyPoints || 0),
      0
    )
    const completedStoryPoints = doneTickets.reduce(
      (acc, t) => acc + (t.storyPoints || 0),
      0
    )
    const progress =
      sprintTickets.length > 0
        ? (doneTickets.length / sprintTickets.length) * 100
        : 0

    return {
      completedStoryPoints,
      doneTickets: doneTickets.length,
      progress,
      totalStoryPoints,
    }
  }

  const typeIcons: Record<string, React.ElementType> = {
    task: CheckSquare,
    bug: Bug,
    story: BookOpen,
    epic: Layers,
    subtask: CheckSquare,
    support: LifeBuoy,
  }

  const getTypeUI = (type: string) => {
    const Icon = typeIcons[type] ?? CheckSquare
    const config = typeConfig[type as keyof typeof typeConfig] ?? {
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    }
    return { Icon, config }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Sprint Sections */}
      {projectSprints.length > 0 ? (
        projectSprints.map((sprint) => {
          const sectionKey = `sprint-${sprint.id}`
          const isExpanded = expandedSections[sectionKey] ?? sprint.isActive
          const sprintTickets = getSprintTickets(sprint.id)
          const sprintStats = getSprintStats(sprintTickets)
          const startDate = formatDate(sprint.startDate)
          const endDate = formatDate(sprint.endDate)
          const dateRange =
            startDate && endDate ? `${startDate} - ${endDate}` : 'Sin fechas'

          return (
            <section key={sprint.id} className="space-y-3">
              {/* Sprint Header */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl bg-card border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => toggleSection(sectionKey)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{sprint.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {dateRange}
                    </div>
                  </div>
                </div>

                {sprint.isActive && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs font-normal gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Activo
                  </Badge>
                )}

                <div className="flex-1" />

                {/* Sprint Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Tickets</p>
                    <p className="text-sm font-semibold">
                      {sprintStats.doneTickets}/{sprintTickets.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Story Points
                    </p>
                    <p className="text-sm font-semibold">
                      {sprintStats.completedStoryPoints}/
                      {sprintStats.totalStoryPoints}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        Progreso
                      </span>
                      <span className="text-xs font-medium">
                        {Math.round(sprintStats.progress)}%
                      </span>
                    </div>
                    <Progress value={sprintStats.progress} className="h-1.5" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onCreateTicket(sprint.id)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir
                </Button>
              </div>

              {/* Sprint Goal */}
              {isExpanded && sprint.goal && (
                <div className="flex items-start gap-2 px-4 py-2 rounded-lg bg-muted/50 ml-10">
                  <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                </div>
              )}

              {/* Sprint Tickets */}
              {isExpanded && (
                <div className="space-y-2 ml-10">
                  {sprintTickets.length > 0 ? (
                    sprintTickets.map((ticket) => {
                      const { Icon, config } = getTypeUI(ticket.type)
                      return (
                        <div
                          key={ticket.id}
                          className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-150 cursor-pointer"
                          onClick={() => onTicketClick(ticket)}
                        >
                          {/* Type Icon */}
                          <div
                            className={cn(
                              'shrink-0 p-1.5 rounded-md',
                              config.bgColor
                            )}
                          >
                            <Icon className={cn('h-3.5 w-3.5', config.color)} />
                          </div>

                          {/* Key */}
                          <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                            {ticket.key}
                          </span>

                          {/* Title */}
                          <span className="flex-1 text-sm font-medium truncate">
                            {ticket.title}
                          </span>

                          {/* Priority Badge */}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold shrink-0"
                          >
                            {ticket.priority.charAt(0).toUpperCase()}
                          </Badge>

                          {/* Story Points */}
                          {ticket.storyPoints && (
                            <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 shrink-0">
                              {ticket.storyPoints}
                            </div>
                          )}

                          {/* Assignee Avatar */}
                          <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-xl border-dashed">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        No hay tickets en este sprint
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateTicket(sprint.id)}
                      >
                        Crear ticket
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })
      ) : (
        <section className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-xl border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No hay sprints creados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea un sprint para verlo en esta vista.
          </p>
        </section>
      )}

      {/* Backlog Section */}
      <section className="space-y-3">
        {/* Backlog Header */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl bg-card border cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => toggleSection('backlog')}
        >
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            {expandedSections.backlog ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Backlog</h3>
              <p className="text-xs text-muted-foreground">
                {backlogTickets.length} tickets sin asignar a sprint
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Backlog Stats */}
          <div className="hidden md:flex items-center gap-4">
            {['high', 'medium', 'low'].map((priority) => {
              const count = backlogTickets.filter(
                (t) => t.priority === priority
              ).length
              if (count === 0) return null
              return (
                <Badge
                  key={priority}
                  variant="secondary"
                  className={cn(
                    'text-xs font-normal',
                    priority === 'high' &&
                      'bg-chart-3/10 text-chart-3 border-chart-3/20',
                    priority === 'urgent' &&
                      'bg-destructive/10 text-destructive border-destructive/20'
                  )}
                >
                  {count} {priority}
                </Badge>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onCreateTicket(null)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        </div>

        {/* Backlog Tickets */}
        {expandedSections.backlog && (
          <div className="space-y-2 ml-10">
            {backlogTickets.length > 0 ? (
              backlogTickets.map((ticket) => {
                const { Icon, config } = getTypeUI(ticket.type)
                return (
                  <div
                    key={ticket.id}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-150 cursor-pointer"
                    onClick={() => onTicketClick(ticket)}
                  >
                    {/* Type Icon */}
                    <div
                      className={cn(
                        'shrink-0 p-1.5 rounded-md',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>

                    {/* Key */}
                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                      {ticket.key}
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm font-medium truncate">
                      {ticket.title}
                    </span>

                    {/* Priority Badge */}
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold shrink-0"
                    >
                      {ticket.priority.charAt(0).toUpperCase()}
                    </Badge>

                    {/* Story Points */}
                    {ticket.storyPoints && (
                      <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 shrink-0">
                        {ticket.storyPoints}
                      </div>
                    )}

                    {/* Assignee Avatar */}
                    <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-xl border-dashed">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  El backlog está vacío
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateTicket(null)}
                >
                  Crear ticket
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
