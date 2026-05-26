'use client'

import * as React from 'react'
import { Pencil, Loader2 } from 'lucide-react'
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
import { updateSprint } from '@/services/sprintService'
import type { ApiSprint } from '@/types/project'

interface EditSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: ApiSprint
  projectId: string
  onUpdated: (sprint: ApiSprint) => void
}

function toDateInputValue(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export function EditSprintDialog({ open, onOpenChange, sprint, projectId, onUpdated }: EditSprintDialogProps) {
  const [name, setName] = React.useState('')
  const [goal, setGoal] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    setName(sprint.name)
    setGoal(sprint.goal ?? '')
    setStartDate(toDateInputValue(sprint.startDate))
    setEndDate(toDateInputValue(sprint.endDate))
    setError('')
  }, [open, sprint])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del sprint es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateSprint(projectId, sprint.id, {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onUpdated(updated)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError('Error al guardar los cambios. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar sprint
          </DialogTitle>
          <DialogDescription>
            Modifica el nombre, objetivo y fechas del sprint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-sprint-name">Nombre *</Label>
            <Input
              id="edit-sprint-name"
              placeholder="Ej: Sprint 1"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-sprint-goal">Objetivo</Label>
            <Textarea
              id="edit-sprint-goal"
              placeholder="¿Qué se quiere lograr en este sprint?"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              disabled={saving}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-sprint-start">Fecha inicio</Label>
              <Input
                id="edit-sprint-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sprint-end">Fecha fin</Label>
              <Input
                id="edit-sprint-end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
