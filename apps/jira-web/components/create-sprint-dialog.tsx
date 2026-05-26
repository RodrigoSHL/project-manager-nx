'use client'

import * as React from 'react'
import { Zap, Loader2 } from 'lucide-react'
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
import { createSprint } from '@/services/sprintService'
import type { ApiSprint } from '@/types/project'

interface CreateSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onCreated: (sprint: ApiSprint) => void
}

export function CreateSprintDialog({ open, onOpenChange, projectId, onCreated }: CreateSprintDialogProps) {
  const [name, setName] = React.useState('')
  const [goal, setGoal] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    setName('')
    setGoal('')
    setStartDate('')
    setEndDate('')
    setError('')
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del sprint es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const sprint = await createSprint(projectId, {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onCreated(sprint)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError('Error al crear el sprint. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Crear sprint
          </DialogTitle>
          <DialogDescription>
            Define el nombre, objetivo y fechas del nuevo sprint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Nombre *</Label>
            <Input
              id="sprint-name"
              placeholder="Ej: Sprint 1"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sprint-goal">Objetivo</Label>
            <Textarea
              id="sprint-goal"
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
              <Label htmlFor="sprint-start">Fecha inicio</Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-end">Fecha fin</Label>
              <Input
                id="sprint-end"
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
              Crear sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
