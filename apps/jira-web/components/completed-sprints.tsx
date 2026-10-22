'use client'

import type { ApiSprint, ApiTicket } from '@/types/project'

const statusLabels: Record<ApiTicket['status'], string> = {
  backlog: 'Backlog', todo: 'Por hacer', in_progress: 'En progreso', in_review: 'En revisión', done: 'Terminado', cancelled: 'Cancelado',
}

export function CompletedSprints({ sprints, tickets, onTicketClick }: {
  sprints: ApiSprint[]
  tickets: ApiTicket[]
  onTicketClick: (ticket: ApiTicket) => void
}) {
  const completed = sprints.filter(sprint => sprint.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  if (!completed.length) return null

  return (
    <section className="mt-6 space-y-3" aria-label="Historial de sprints">
      <h2 className="text-sm font-semibold">Sprints finalizados</h2>
      {completed.map(sprint => {
        const summary = sprint.completionSummary
        return (
          <details key={sprint.id} className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer text-sm font-semibold">{sprint.name} · Finalizado el {new Date(sprint.completedAt!).toLocaleDateString('es-CL')}</summary>
            {summary && <div className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{summary.doneTickets}/{summary.totalTickets} terminados · {summary.cancelledTickets} cancelados · {summary.movedTickets} movidos a {summary.targetSprintName ?? 'Backlog'}</p>
              <p className="text-sm text-muted-foreground">Story points completados: {summary.completedStoryPoints}/{summary.totalStoryPoints}</p>
              <p className="text-xs text-muted-foreground">Tickets y estados registrados al finalizar el sprint:</p>
              {summary.tickets.length === 0 && <p className="text-sm text-muted-foreground">El sprint se cerró sin tickets.</p>}
              <ul className="space-y-2">
                {summary.tickets.map(snapshot => {
                  const current = tickets.find(ticket => ticket.id === snapshot.id && ticket.projectId === sprint.projectId)
                  const label = `${snapshot.key} · ${snapshot.title}`
                  return <li key={snapshot.id} className="flex flex-wrap justify-between gap-2 text-sm">
                    {current ? <button type="button" className="text-left hover:underline" onClick={() => onTicketClick(current)}>{label}</button> : <span>{label}</span>}
                    <span className="text-xs text-muted-foreground">{statusLabels[snapshot.status]}{snapshot.status !== 'done' && snapshot.status !== 'cancelled' ? ' · Movido' : ''}</span>
                  </li>
                })}
              </ul>
            </div>}
          </details>
        )
      })}
    </section>
  )
}
