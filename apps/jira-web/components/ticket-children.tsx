'use client'

import { BookOpen, CheckSquare, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApiTicket } from '@/types/project'

export function TicketChildren({ ticket, tickets, onSelect, onCreate }: {
  ticket: ApiTicket
  tickets: ApiTicket[]
  onSelect: (ticket: ApiTicket) => void
  onCreate?: () => void
}) {
  if (ticket.type !== 'epic' && ticket.type !== 'story') return null
  const isEpic = ticket.type === 'epic'
  const children = tickets.filter(child => child.projectId === ticket.projectId && (isEpic
    ? child.type === 'story' && child.epicId === ticket.id
    : child.type === 'subtask' && child.parentTicketId === ticket.id))
  const title = isEpic ? 'Historias de usuario' : 'Subtareas'
  const Icon = isEpic ? BookOpen : CheckSquare
  return (
    <section aria-label={title} className="mb-6 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-purple-600">{title}</h3>
        <Badge variant="secondary">{children.length}</Badge>
        {onCreate && <Button type="button" variant="outline" size="sm" className="ml-auto h-7" onClick={onCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />{isEpic ? 'Crear historia' : 'Crear subtarea'}
        </Button>}
      </div>
      {children.length > 0 ? (
        <div className="space-y-2">
          {children.map(child => (
            <button key={child.id} type="button"
              className="flex w-full items-center gap-2 rounded-md bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(child)}>
              <Icon className="h-3.5 w-3.5 shrink-0 text-green-600" />
              <span className="font-mono text-xs text-muted-foreground">{child.key}</span>
              <span className="min-w-0 flex-1 truncate">{child.title}</span>
              <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">{child.status}</Badge>
            </button>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">{isEpic ? 'Esta épica aún no tiene historias vinculadas.' : 'Esta historia aún no tiene subtareas vinculadas.'}</p>}
    </section>
  )
}
