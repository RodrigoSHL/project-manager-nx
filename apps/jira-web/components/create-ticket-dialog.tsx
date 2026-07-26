'use client'

import * as React from 'react'
import { Loader2, TicketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTicket } from '@/services/ticketService'
import { getTeamMemberAssigneeId } from '@/lib/team-members'
import type { ApiTicket, ApiSprint, ApiTeamMember } from '@/types/project'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  sprints: ApiSprint[]
  teamMembers?: ApiTeamMember[]
  initialStatus?: ApiTicket['status']
  initialSprintId?: string | null
  onCreated: (ticket: ApiTicket) => void
}

const STATUS_OPTIONS: { value: ApiTicket['status']; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: ApiTicket['priority']; label: string; icon: string }[] = [
  { value: 'urgent', label: 'Urgente', icon: '🔴' },
  { value: 'high', label: 'Alta', icon: '🟠' },
  { value: 'medium', label: 'Media', icon: '🟡' },
  { value: 'low', label: 'Baja', icon: '🔵' },
  { value: 'lowest', label: 'Mínima', icon: '⚪' },
]

const TYPE_OPTIONS: { value: ApiTicket['type']; label: string; icon: string }[] = [
  { value: 'story', label: 'Historia', icon: '📖' },
  { value: 'task', label: 'Tarea', icon: '✅' },
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'support', label: 'Soporte', icon: '🛟' },
  { value: 'epic', label: 'Épica', icon: '⚡' },
  { value: 'subtask', label: 'Subtarea', icon: '🔹' },
]

export function CreateTicketDialog({
  open,
  onOpenChange,
  projectId,
  sprints,
  teamMembers = [],
  initialStatus,
  initialSprintId,
  onCreated,
}: CreateTicketDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<ApiTicket['status']>('todo')
  const [priority, setPriority] = React.useState<ApiTicket['priority']>('medium')
  const [type, setType] = React.useState<ApiTicket['type']>('task')
  const [sprintId, setSprintId] = React.useState<string>('none')
  const [assigneeId, setAssigneeId] = React.useState<string>('none')
  const [storyPoints, setStoryPoints] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const activeSprint = sprints.find(s => s.isActive)

  React.useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setStatus(initialStatus ?? 'todo')
    setPriority('medium')
    setType('task')
    // undefined = no preference (default to active sprint); null = explicitly no sprint (backlog)
    setSprintId(initialSprintId !== undefined ? (initialSprintId ?? 'none') : (activeSprint?.id ?? 'none'))
    setAssigneeId('none')
    setStoryPoints('')
    setDueDate('')
    setError('')
  }, [open, initialStatus, initialSprintId, activeSprint?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('El título del ticket es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const ticket = await createTicket(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        type,
        sprintId: sprintId === 'none' ? null : sprintId,
        assigneeId: assigneeId === 'none' ? null : assigneeId,
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
        dueDate: dueDate || null,
      })
      onCreated(ticket)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al crear el ticket. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">{/* L */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Crear ticket
          </DialogTitle>
          <DialogDescription>
            Añade un nuevo ticket al proyecto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Título *</Label>
            <Input
              id="ticket-title"
              placeholder="Describe el ticket en una línea"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Type / Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as ApiTicket['type'])} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        <span>{o.icon}</span>
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={v => setPriority(v as ApiTicket['priority'])} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        <span>{o.icon}</span>
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status / Sprint row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={v => setStatus(v as ApiTicket['status'])} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sprint (Backlog)</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{s.name}</span>
                        {s.isActive && <span className="shrink-0">⚡</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee / Story points / Due date row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Asignado a</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={getTeamMemberAssigneeId(member)}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-sp">Story Points</Label>
              <Input
                id="ticket-sp"
                type="number"
                min="0"
                max="100"
                placeholder="—"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-due">Fecha límite</Label>
              <Input
                id="ticket-due"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Descripción</Label>
            <Textarea
              id="ticket-desc"
              placeholder="Detalles adicionales, criterios de aceptación..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={saving}
              rows={3}
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
