'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { findTeamMemberByAssigneeId } from '@/lib/team-members'
import { buildTicketPageHref } from '@/lib/ticket-link'
import { cn } from '@/lib/utils'
import type { ApiSprint, ApiTeamMember, ApiTicket } from '@/types/project'

const STATUSES: Record<ApiTicket['status'], { label: string; dot: string }> = {
  backlog: { label: 'Backlog', dot: 'bg-muted-foreground' },
  todo: { label: 'Pendiente', dot: 'bg-foreground' },
  in_progress: { label: 'En curso', dot: 'bg-primary' },
  in_review: { label: 'En revisión', dot: 'bg-yellow-500' },
  done: { label: 'Completado', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelado', dot: 'bg-destructive' },
}
const PRIORITIES: Record<ApiTicket['priority'], string> = {
  lowest: 'Mínima', low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}
const TYPES: Record<ApiTicket['type'], string> = {
  task: 'Tarea', bug: 'Bug', story: 'Historia', epic: 'Épica', subtask: 'Subtarea', support: 'Soporte',
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha'
  // Calendar dates should keep their day in every browser time zone.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-start justify-between gap-4">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
  </div>
}

export function TicketSummary({ ticket, tickets, sprints, teamMembers }: {
  ticket: ApiTicket
  tickets: ApiTicket[]
  sprints: ApiSprint[]
  teamMembers: ApiTeamMember[]
}) {
  const status = STATUSES[ticket.status]
  const assignee = findTeamMemberByAssigneeId(teamMembers.filter(member => member.projectId === ticket.projectId), ticket.assigneeId)
  const sprint = sprints.find(item => item.id === ticket.sprintId && item.projectId === ticket.projectId)
  const parent = tickets.find(item => item.projectId === ticket.projectId && (ticket.type === 'subtask'
    ? item.id === ticket.parentTicketId && item.type === 'story'
    : ticket.type === 'story' && item.id === ticket.epicId && item.type === 'epic'))
  const children = tickets.filter(item => item.projectId === ticket.projectId && (ticket.type === 'epic'
    ? item.type === 'story' && item.epicId === ticket.id
    : ticket.type === 'story' && item.type === 'subtask' && item.parentTicketId === ticket.id))
  const closed = children.filter(item => item.status === 'done' || item.status === 'cancelled').length

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3">
        <span className="font-mono text-xs text-muted-foreground">{ticket.key}</span>
        <Badge variant="outline" className="gap-1.5">
          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', status?.dot)} />
          {status?.label ?? 'Sin estado'}
        </Badge>
      </div>

      <dl className="space-y-4">
        <Field label="Tipo">{TYPES[ticket.type]}</Field>
        <Field label="Prioridad">
          <span className={cn(ticket.priority === 'urgent' ? 'text-destructive' : ticket.priority === 'high' && 'text-orange-600 dark:text-orange-400')}>
            {PRIORITIES[ticket.priority]}
          </span>
        </Field>
        <Field label="Asignado">
          {assignee ? <span className="inline-flex min-w-0 items-center justify-end gap-2">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={assignee.avatar} alt="" />
              <AvatarFallback className="text-[9px]">{assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 break-words">{assignee.name}</span>
          </span> : ticket.assigneeId ? 'Usuario no disponible' : 'Sin asignar'}
        </Field>
        {ticket.type !== 'epic' && <Field label="Sprint">{sprint?.name ?? (ticket.sprintId ? 'Sprint no disponible' : 'Sin sprint')}</Field>}
        <Field label="Estimación">{ticket.storyPoints == null ? 'Sin estimar' : `${ticket.storyPoints} pts`}</Field>
      </dl>

      {parent && <div className="space-y-2 border-t pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{parent.type === 'epic' ? 'Épica' : 'Historia de usuario'}</h3>
        <Link href={buildTicketPageHref(ticket.projectId, parent.id)} className="block break-words rounded text-sm text-brand-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="font-mono text-xs">{parent.key}</span> · {parent.title}
        </Link>
      </div>}

      {children.length > 0 && <div className="space-y-2 border-t pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{ticket.type === 'epic' ? 'Historias de usuario' : 'Subtareas'}</h3>
        <p className="flex justify-between gap-2"><span>Cerradas</span><span className="font-medium tabular-nums">{closed} de {children.length}</span></p>
        <div role="progressbar" aria-label="Avance de tickets relacionados" aria-valuemin={0} aria-valuemax={children.length} aria-valuenow={closed}
          className="h-1.5 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${closed / children.length * 100}%` }} />
        </div>
      </div>}

      <div className="space-y-4 border-t pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fechas</h3>
        <dl className="space-y-3 text-xs">
          <Field label="Creado">{formatDate(ticket.createdAt)}</Field>
          <Field label="Actualizado">{formatDate(ticket.updatedAt)}</Field>
          <Field label="Vencimiento">{formatDate(ticket.dueDate)}</Field>
        </dl>
      </div>
    </div>
  )
}
