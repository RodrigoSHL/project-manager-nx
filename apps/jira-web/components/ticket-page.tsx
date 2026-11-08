'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { TicketDetail } from '@/components/ticket-detail'
import { Button } from '@/components/ui/button'
import { useProject } from '@/contexts/project-context'
import { buildTicketPageHref } from '@/lib/ticket-link'

export function TicketPage({ projectId, ticketId }: { projectId: string; ticketId: string }) {
  const router = useRouter()
  const { project, tickets, sprints, teamMembers, canWrite, loading, error, reload,
    onTicketUpdated, onTicketDeleted, onCreateChild } = useProject()
  const ticket = project?.id === projectId
    ? tickets.find(item => item.id === ticketId && item.projectId === projectId) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <nav aria-label="Navegación del ticket" className="flex shrink-0 items-center gap-3 border-b px-4 py-2 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/"><ArrowLeft className="h-4 w-4" />Volver al proyecto</Link>
        </Button>
        {project?.id === projectId && <span className="min-w-0 truncate text-sm text-muted-foreground">{project.name}</span>}
      </nav>

      {error ? (
        <div className="m-auto space-y-4 p-6 text-center">
          <h1 className="text-xl font-semibold">No se pudo abrir el ticket</h1>
          <p role="alert" className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={reload}>Reintentar</Button>
        </div>
      ) : loading ? (
        <div role="status" className="m-auto flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />Cargando ticket…
        </div>
      ) : !ticket ? (
        <div className="m-auto space-y-2 p-6 text-center">
          <h1 className="text-xl font-semibold">Ticket no disponible</h1>
          <p className="text-sm text-muted-foreground">El ticket no existe en este proyecto o ya no tienes acceso.</p>
        </div>
      ) : (
        <TicketDetail
          key={ticket.id}
          variant="page"
          open
          ticket={ticket}
          projectId={projectId}
          tickets={tickets}
          sprints={sprints}
          teamMembers={teamMembers}
          canWrite={canWrite}
          onClose={() => router.push('/')}
          onUpdated={onTicketUpdated}
          onDeleted={id => { onTicketDeleted(id); router.push('/') }}
          onSelectTicket={next => router.push(buildTicketPageHref(projectId, next.id))}
          onCreateChild={canWrite ? onCreateChild : undefined}
        />
      )}
    </div>
  )
}
