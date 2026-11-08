'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { TicketDetail } from '@/components/ticket-detail'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { buildProjectBoardHref, buildTicketPageHref } from '@/lib/ticket-link'
import { getProjects, getProjectPermissions, getProjectTeamMembers } from '@/services/projectService'
import { getTicketsByProject } from '@/services/ticketService'
import { getSprintsByProject } from '@/services/sprintService'
import type { ApiProject, ApiSprint, ApiTeamMember, ApiTicket } from '@/types/project'

interface TicketPageData {
  project: ApiProject
  tickets: ApiTicket[]
  sprints: ApiSprint[]
  teamMembers: ApiTeamMember[]
  canWrite: boolean
}

export function TicketPage({ projectId, ticketId }: { projectId: string; ticketId: string }) {
  const router = useRouter()
  const [data, setData] = React.useState<TicketPageData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [retry, setRetry] = React.useState(0)
  const [parent, setParent] = React.useState<ApiTicket | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    setParent(null)
    async function load() {
      try {
        const projects = await getProjects()
        if (cancelled) return
        const project = projects.find(item => item.id === projectId)
        if (!project) throw new Error('El proyecto no está disponible o no tienes acceso.')
        const [tickets, sprints, teamMembers, permissions] = await Promise.all([
          getTicketsByProject(projectId),
          getSprintsByProject(projectId),
          getProjectTeamMembers(projectId),
          getProjectPermissions(projectId),
        ])
        if (!cancelled) setData({
          project,
          tickets: tickets.filter(ticket => ticket.projectId === projectId),
          sprints,
          teamMembers: teamMembers.filter(member => member.isActive !== false),
          canWrite: permissions.canWrite,
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el ticket.')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [projectId, retry])

  const current = data?.project.id === projectId ? data : null
  const ticket = current?.tickets.find(item => item.id === ticketId)
  const boardHref = current ? buildProjectBoardHref(current.project) : '/'
  const selectTicket = (next: ApiTicket) => router.push(buildTicketPageHref(projectId, next.id))

  return (
    <main className="flex h-dvh flex-col bg-muted/30">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col border-x bg-background">
        <nav aria-label="Navegación del ticket" className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={boardHref}><ArrowLeft className="h-4 w-4" />Volver al proyecto</Link>
          </Button>
          {current && <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{current.project.name}</span>}
          <ThemeToggle className="ml-auto shrink-0" />
        </nav>

        {error ? (
          <div className="m-auto space-y-4 p-6 text-center">
            <h1 className="text-xl font-semibold">No se pudo abrir el ticket</h1>
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>
          </div>
        ) : !current ? (
          <div role="status" className="m-auto flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />Cargando ticket…
          </div>
        ) : !ticket ? (
          <div className="m-auto space-y-2 p-6 text-center">
            <h1 className="text-xl font-semibold">Ticket no disponible</h1>
            <p className="text-sm text-muted-foreground">El ticket no existe en este proyecto o ya no tienes acceso.</p>
          </div>
        ) : (
          <>
            <TicketDetail
              key={ticket.id}
              variant="page"
              open
              ticket={ticket}
              projectId={projectId}
              tickets={current.tickets}
              sprints={current.sprints}
              teamMembers={current.teamMembers}
              canWrite={current.canWrite}
              onClose={() => router.push(boardHref)}
              onUpdated={updated => setData(previous => previous ? {
                ...previous, tickets: previous.tickets.map(item => item.id === updated.id ? updated : item),
              } : previous)}
              onDeleted={() => router.push(boardHref)}
              onSelectTicket={selectTicket}
              onCreateChild={current.canWrite ? setParent : undefined}
            />
            {current.canWrite && parent && <CreateTicketDialog
              key={parent.id}
              open
              onOpenChange={open => { if (!open) setParent(null) }}
              projectId={projectId}
              sprints={current.sprints}
              teamMembers={current.teamMembers}
              availableEpics={current.tickets.filter(item => item.type === 'epic')}
              availableStories={current.tickets.filter(item => item.type === 'story')}
              initialType={parent.type === 'epic' ? 'story' : 'subtask'}
              initialEpicId={parent.type === 'epic' ? parent.id : null}
              initialParentTicketId={parent.type === 'story' ? parent.id : null}
              initialSprintId={parent.type === 'story' ? parent.sprintId : undefined}
              onCreated={created => { setParent(null); selectTicket(created) }}
            />}
          </>
        )}
      </div>
    </main>
  )
}
