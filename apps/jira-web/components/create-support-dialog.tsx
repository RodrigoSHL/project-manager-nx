'use client'

import * as React from 'react'
import { Loader2, LifeBuoy, User, FileText, Clock, Coins, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { createTicket } from '@/services/ticketService'
import { updateSupportDetail } from '@/services/supportDetailService'
import type { ApiTicket, ApiTeamMember } from '@/types/project'

interface CreateSupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  teamMembers?: ApiTeamMember[]
  onCreated: (ticket: ApiTicket) => void
}

const PRIORITY_OPTIONS: { value: ApiTicket['priority']; label: string; color: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgente',  color: 'text-destructive',     dot: 'bg-destructive' },
  { value: 'high',   label: 'Alta',     color: 'text-orange-500',       dot: 'bg-orange-500' },
  { value: 'medium', label: 'Media',    color: 'text-yellow-500',       dot: 'bg-yellow-500' },
  { value: 'low',    label: 'Baja',     color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  { value: 'lowest', label: 'Mínima',   color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
]

export function CreateSupportDialog({
  open,
  onOpenChange,
  projectId,
  teamMembers = [],
  onCreated,
}: CreateSupportDialogProps) {
  // — Ticket fields
  const [title, setTitle]               = React.useState('')
  const [description, setDescription]   = React.useState('')
  const [priority, setPriority]         = React.useState<ApiTicket['priority']>('high')
  const [assigneeId, setAssigneeId]     = React.useState('none')

  // — Support-detail fields
  const [clientContact, setClientContact] = React.useState('')
  const [ufValue, setUfValue]             = React.useState('')
  const [isBillable, setIsBillable]       = React.useState(true)
  const [slaDeadline, setSlaDeadline]     = React.useState('')
  const [notes, setNotes]                 = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [error, setError]   = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setTitle(''); setDescription(''); setPriority('high'); setAssigneeId('none')
      setClientContact(''); setUfValue(''); setIsBillable(true); setSlaDeadline(''); setNotes('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('El título es requerido'); return }

    setSaving(true)
    setError('')
    try {
      const ticket = await createTicket(projectId, {
        title:       title.trim(),
        description: description.trim() || undefined,
        type:        'support',
        priority,
        status:      'todo',
        assigneeId:  assigneeId !== 'none' ? assigneeId : null,
      })

      // Update the auto-created support detail with form data
      const detailPatch: Record<string, unknown> = { isBillable }
      if (clientContact.trim()) detailPatch.clientContact = clientContact.trim()
      if (ufValue)               detailPatch.ufValue       = parseFloat(ufValue)
      if (slaDeadline)           detailPatch.slaDeadline   = new Date(slaDeadline).toISOString()
      if (notes.trim())          detailPatch.notes         = notes.trim()

      if (Object.keys(detailPatch).length > 1 || !isBillable) {
        await updateSupportDetail(projectId, ticket.id, detailPatch as Parameters<typeof updateSupportDetail>[2])
      }

      onCreated(ticket)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el soporte')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 shrink-0">
            <LifeBuoy className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Nuevo ticket de soporte</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Registra el soporte y la información de cobro
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* ── Sección: Ticket ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles del ticket
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-title" className="text-sm font-medium">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="support-title"
                  placeholder="Ej: Error en módulo de facturación"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-desc" className="text-sm font-medium">Descripción</Label>
                <Textarea
                  id="support-desc"
                  placeholder="Describe el problema reportado por el cliente..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Prioridad</Label>
                  <Select value={priority} onValueChange={v => setPriority(v as ApiTicket['priority'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', opt.dot)} />
                            <span className={opt.color}>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Asignado a</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.userId ?? m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* ── Sección: Soporte & Cobro ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Soporte & cobro
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="support-client" className="text-sm font-medium">
                    <User className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                    Contacto cliente
                  </Label>
                  <Input
                    id="support-client"
                    placeholder="Nombre o email"
                    value={clientContact}
                    onChange={e => setClientContact(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="support-uf" className="text-sm font-medium">
                    Valor (UF)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">
                      UF
                    </span>
                    <Input
                      id="support-uf"
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="0.00"
                      className="pl-9"
                      value={ufValue}
                      onChange={e => setUfValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="support-sla" className="text-sm font-medium">
                    <Clock className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                    Deadline SLA
                  </Label>
                  <Input
                    id="support-sla"
                    type="datetime-local"
                    value={slaDeadline}
                    onChange={e => setSlaDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Facturable</Label>
                  <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input bg-background">
                    <Switch
                      id="support-billable"
                      checked={isBillable}
                      onCheckedChange={setIsBillable}
                    />
                    <label htmlFor="support-billable" className="text-sm cursor-pointer select-none">
                      {isBillable ? 'Sí, se cobra' : 'No se cobra'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-notes" className="text-sm font-medium">
                  Notas internas
                </Label>
                <Textarea
                  id="support-notes"
                  placeholder="Acuerdos, detalles de tarifa, condiciones especiales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !title.trim()} className="gap-2 min-w-32.5">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
              ) : (
                <><LifeBuoy className="h-4 w-4" /> Crear soporte</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
