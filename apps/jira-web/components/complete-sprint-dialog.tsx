'use client'

import * as React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { completeSprint } from '@/services/sprintService'
import type { ApiSprint, ApiTicket } from '@/types/project'

interface CompleteSprintDialogProps {
  sprint: ApiSprint
  sprints: ApiSprint[]
  tickets: ApiTicket[]
  onOpenChange: (open: boolean) => void
  onCompleted: (sprint: ApiSprint) => void
}

export function CompleteSprintDialog({ sprint, sprints, tickets, onOpenChange, onCompleted }: CompleteSprintDialogProps) {
  const [destination, setDestination] = React.useState('backlog')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const sprintTickets = tickets.filter(ticket => ticket.projectId === sprint.projectId && ticket.sprintId === sprint.id)
  const done = sprintTickets.filter(ticket => ticket.status === 'done').length
  const cancelled = sprintTickets.filter(ticket => ticket.status === 'cancelled').length
  const pending = sprintTickets.length - done - cancelled
  const destinations = sprints.filter(candidate => candidate.projectId === sprint.projectId && candidate.id !== sprint.id && !candidate.completedAt)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const completed = await completeSprint(sprint.projectId, sprint.id, destination === 'backlog' ? null : destination)
      onCompleted(completed)
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo finalizar el sprint. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!saving) onOpenChange(open) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Finalizar sprint</DialogTitle>
          <DialogDescription>Revisa el cierre de {sprint.name} y el destino de sus tickets pendientes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <dl className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
            <div><dt className="text-muted-foreground">Terminados</dt><dd className="font-semibold">{done}</dd></div>
            <div><dt className="text-muted-foreground">Cancelados</dt><dd className="font-semibold">{cancelled}</dd></div>
            <div><dt className="text-muted-foreground">Pendientes</dt><dd className="font-semibold">{pending}</dd></div>
          </dl>
          {pending > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="complete-sprint-destination">Mover tickets pendientes a</Label>
              <select id="complete-sprint-destination" value={destination} onChange={event => setDestination(event.target.value)} disabled={saving} className="w-full rounded-md border bg-background p-2 text-sm">
                <option value="backlog">Backlog</option>
                {destinations.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">En el backlog quedarán con estado Backlog. En otro sprint conservarán su avance. El sprint de destino no se activa automáticamente.</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">No hay tickets pendientes. Si entra trabajo nuevo antes de confirmar, se enviará al backlog.</p>}
          <p className="text-sm text-muted-foreground">Se guardará un resumen con todos los tickets y sus estados al cierre. Los terminados y cancelados permanecerán en este sprint. Un sprint finalizado no se puede reactivar.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Finalizar sprint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
