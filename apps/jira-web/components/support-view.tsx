'use client'

import * as React from 'react'
import {
  LifeBuoy, Plus, AlertCircle, CheckCircle2, Clock, Timer,
  TrendingUp, Coins, User, FileText, ExternalLink, Loader2,
  CheckSquare, CalendarClock, Ban, Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSupportDetail, updateSupportDetail } from '@/services/supportDetailService'
import { updateTicket } from '@/services/ticketService'
import {
  findTeamMemberByAssigneeId,
  getTeamMemberAssigneeId,
} from '@/lib/team-members'
import { ValorizarDialog } from '@/components/valorizar-dialog'
import type { ApiTicket, ApiTeamMember, ApiSupportDetail } from '@/types/project'

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ApiTicket['status']; label: string; dot: string; bg: string }[] = [
  { value: 'todo',        label: 'Por hacer',   dot: 'bg-foreground',      bg: 'bg-secondary text-secondary-foreground' },
  { value: 'in_progress', label: 'En proceso',  dot: 'bg-blue-500',        bg: 'bg-blue-500/15 text-blue-400' },
  { value: 'in_review',   label: 'En revisión', dot: 'bg-amber-500',       bg: 'bg-amber-500/15 text-amber-500' },
  { value: 'done',        label: 'Resuelto',    dot: 'bg-emerald-500',     bg: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'cancelled',   label: 'Cancelado',   dot: 'bg-muted-foreground', bg: 'bg-muted text-muted-foreground' },
]

const PRIORITY_OPTIONS: { value: ApiTicket['priority']; label: string; color: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgente', color: 'text-destructive',     dot: 'bg-destructive' },
  { value: 'high',   label: 'Alta',    color: 'text-orange-500',       dot: 'bg-orange-500' },
  { value: 'medium', label: 'Media',   color: 'text-yellow-500',       dot: 'bg-yellow-500' },
  { value: 'low',    label: 'Baja',    color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  { value: 'lowest', label: 'Mínima',  color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
]

// ─── SLA helpers ─────────────────────────────────────────────────────────────

type SlaState = 'none' | 'overdue' | 'critical' | 'warning' | 'ok'

function getSlaState(slaDeadline: string | null, resolved: boolean): SlaState {
  if (!slaDeadline) return 'none'
  if (resolved) return 'ok'
  const diff = new Date(slaDeadline).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  if (diff < 4 * 3600_000) return 'critical'
  if (diff < 24 * 3600_000) return 'warning'
  return 'ok'
}

function SlaIndicator({ slaDeadline, resolved }: { slaDeadline: string | null; resolved: boolean }) {
  if (!slaDeadline) {
    return <span className="text-xs text-muted-foreground/50">—</span>
  }

  const state = getSlaState(slaDeadline, resolved)

  if (state === 'none') {
    return <span className="text-xs text-muted-foreground/50">—</span>
  }

  const fmt = new Date(slaDeadline).toLocaleDateString('es-ES', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const config = {
    overdue:  { icon: AlertCircle,   cls: 'text-destructive',  label: 'Vencido' },
    critical: { icon: Timer,         cls: 'text-destructive',  label: fmt },
    warning:  { icon: Clock,         cls: 'text-amber-500',    label: fmt },
    ok:       { icon: CheckCircle2,  cls: 'text-emerald-500',  label: fmt },
  }[state]

  const Icon = config.icon

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('flex items-center gap-1 text-xs font-medium whitespace-nowrap', config.cls)}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {state === 'overdue' ? 'Vencido' : config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>SLA: {fmt}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── SupportDetailSheet ───────────────────────────────────────────────────────

interface SupportDetailSheetProps {
  ticket: ApiTicket | null
  open: boolean
  onClose: () => void
  projectId: string
  teamMembers: ApiTeamMember[]
  onUpdated: (ticket: ApiTicket) => void
}

function SupportDetailSheet({ ticket, open, onClose, projectId, teamMembers, onUpdated }: SupportDetailSheetProps) {
  const [loadingDetail, setLoadingDetail] = React.useState(false)

  // — Ticket editable state
  const [status, setStatus]     = React.useState<ApiTicket['status']>('todo')
  const [priority, setPriority] = React.useState<ApiTicket['priority']>('high')
  const [title, setTitle]       = React.useState('')
  const [description, setDesc]  = React.useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState('')
  const [assigneeId, setAssigneeId] = React.useState('none')

  // — Support-detail editable state
  const [clientContact, setClientContact] = React.useState('')
  const [ufValue, setUfValue]             = React.useState('')
  const [isBillable, setIsBillable]       = React.useState(true)
  const [slaDeadline, setSlaDeadline]     = React.useState('')
  const [billedAt, setBilledAt]           = React.useState('')
  const [invoiceRef, setInvoiceRef]       = React.useState('')
  const [resolvedAt, setResolvedAt]       = React.useState('')
  const [notes, setNotes]                 = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')

  // Load ticket fields into state when ticket changes
  React.useEffect(() => {
    if (!ticket) return
    setStatus(ticket.status)
    setPriority(ticket.priority)
    setTitle(ticket.title)
    setDesc(ticket.description ?? '')
    setAcceptanceCriteria(ticket.acceptanceCriteria ?? '')
    const member = findTeamMemberByAssigneeId(teamMembers, ticket.assigneeId)
    setAssigneeId(member ? getTeamMemberAssigneeId(member) : 'none')
  }, [ticket, teamMembers])

  // Load support detail when sheet opens
  React.useEffect(() => {
    if (!open || !ticket) return
    setLoadingDetail(true)
    getSupportDetail(projectId, ticket.id)
      .then(d => {
        setClientContact(d.clientContact ?? '')
        setUfValue(d.ufValue != null ? String(d.ufValue) : '')
        setIsBillable(d.isBillable)
        setSlaDeadline(d.slaDeadline ? d.slaDeadline.slice(0, 16) : '')
        setBilledAt(d.billedAt ?? '')
        setInvoiceRef(d.invoiceRef ?? '')
        setResolvedAt(d.resolvedAt ? d.resolvedAt.slice(0, 16) : '')
        setNotes(d.notes ?? '')
      })
      .catch(() => undefined)
      .finally(() => setLoadingDetail(false))
  }, [open, ticket, projectId])

  const handleSave = async () => {
    if (!ticket) return
    setSaving(true)
    setSaveError('')
    try {
      // Update ticket
      const updatedTicket = await updateTicket(projectId, ticket.id, {
        title, description, acceptanceCriteria, status, priority,
        assigneeId: assigneeId !== 'none' ? assigneeId : null,
      })

      // Update support detail
      await updateSupportDetail(projectId, ticket.id, {
        clientContact:  clientContact.trim() || null,
        ufValue:        ufValue ? parseFloat(ufValue) : null,
        isBillable,
        slaDeadline:    slaDeadline ? new Date(slaDeadline).toISOString() : null,
        billedAt:       billedAt || null,
        invoiceRef:     invoiceRef.trim() || null,
        resolvedAt:     resolvedAt ? new Date(resolvedAt).toISOString() : null,
        notes:          notes.trim() || null,
      } as Parameters<typeof updateSupportDetail>[2])

      onUpdated(updatedTicket)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const statusCfg = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]
  const priorityCfg = PRIORITY_OPTIONS.find(p => p.value === priority) ?? PRIORITY_OPTIONS[2]

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500/10 shrink-0 mt-0.5">
              <LifeBuoy className="h-4.5 w-4.5 text-sky-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket?.key}</span>
              </div>
              <SheetTitle className="text-sm font-semibold leading-snug line-clamp-2">
                {ticket?.title}
              </SheetTitle>
            </div>
          </div>

          {/* Status + Priority pills */}
          <div className="flex items-center gap-2 mt-3">
            <Select value={status} onValueChange={v => setStatus(v as ApiTicket['status'])}>
              <SelectTrigger className={cn('h-7 text-xs font-medium border-0 px-2.5 rounded-full w-auto gap-1.5', statusCfg.bg)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', opt.dot)} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={v => setPriority(v as ApiTicket['priority'])}>
              <SelectTrigger className="h-7 text-xs font-medium border border-border px-2.5 rounded-full w-auto gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', priorityCfg.dot)} />
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
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="support" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 mb-0 w-fit">
              <TabsTrigger value="ticket" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" />Ticket
              </TabsTrigger>
              <TabsTrigger value="support" className="text-xs gap-1.5">
                <Coins className="h-3.5 w-3.5" />Soporte & Cobro
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Ticket ── */}
            <TabsContent value="ticket" className="px-6 pb-6 pt-4 space-y-4 flex-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</Label>
                <Textarea
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  rows={5}
                  className="resize-none text-sm"
                  placeholder="Describe el problema..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Criterios de aceptación</Label>
                <Textarea
                  value={acceptanceCriteria}
                  onChange={e => setAcceptanceCriteria(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                  placeholder="¿Qué debe cumplirse para resolver el soporte?"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asignado a</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={getTeamMemberAssigneeId(m)}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={m.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {m.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {m.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* ── Tab: Soporte & Cobro ── */}
            <TabsContent value="support" className="px-6 pb-6 pt-4 space-y-5 flex-1">
              {loadingDetail && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingDetail && (
                <>
                  {/* Client + UF */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Contacto cliente
                      </Label>
                      <Input
                        placeholder="Nombre o email"
                        value={clientContact}
                        onChange={e => setClientContact(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Valor (UF)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">UF</span>
                        <Input
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

                  {/* SLA + Billable */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Deadline SLA
                      </Label>
                      <Input
                        type="datetime-local"
                        value={slaDeadline}
                        onChange={e => setSlaDeadline(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Facturable
                      </Label>
                      <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input bg-background">
                        <Switch
                          checked={isBillable}
                          onCheckedChange={setIsBillable}
                        />
                        <span className="text-sm">{isBillable ? 'Sí, se cobra' : 'No se cobra'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing section */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cierre & facturación
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Fecha resolución</Label>
                        <Input
                          type="datetime-local"
                          value={resolvedAt}
                          onChange={e => setResolvedAt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Fecha de cobro</Label>
                        <Input
                          type="date"
                          value={billedAt}
                          onChange={e => setBilledAt(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Referencia factura / boleta</Label>
                      <Input
                        placeholder="Ej: FAC-2026-0042"
                        value={invoiceRef}
                        onChange={e => setInvoiceRef(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Notas internas
                    </Label>
                    <Textarea
                      placeholder="Acuerdos, tarifas especiales, contexto adicional..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          {saveError ? (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />{saveError}
            </p>
          ) : <span />}
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-32.5">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main SupportView ─────────────────────────────────────────────────────────

interface SupportViewProps {
  tickets: ApiTicket[]
  projectId: string
  teamMembers: ApiTeamMember[]
  onCreateSupport: () => void
  onTicketUpdated: (ticket: ApiTicket) => void
}

type BillableFilter = 'all' | 'billable' | 'non_billable' | 'billed'
type SlaFilter = 'all' | 'overdue' | 'no_sla'

export function SupportView({ tickets, projectId, teamMembers, onCreateSupport, onTicketUpdated }: SupportViewProps) {
  const supportTickets = React.useMemo(() => tickets.filter(t => t.type === 'support'), [tickets])

  // Support details cache: ticketId → ApiSupportDetail
  const [detailsMap, setDetailsMap] = React.useState<Record<string, ApiSupportDetail>>({})
  const [loadingDetails, setLoadingDetails] = React.useState(false)

  // Selected ticket for detail sheet
  const [selectedTicket, setSelectedTicket] = React.useState<ApiTicket | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Valorizar dialog
  const [valorizarTicket, setValorizarTicket] = React.useState<ApiTicket | null>(null)
  const [valorizarOpen, setValorizarOpen] = React.useState(false)

  // Filters
  const [statusFilter, setStatusFilter]   = React.useState<ApiTicket['status'] | 'all'>('all')
  const [billableFilter, setBillableFilter] = React.useState<BillableFilter>('all')
  const [slaFilter, setSlaFilter]           = React.useState<SlaFilter>('all')
  const [search, setSearch]                 = React.useState('')

  // Load all support details when support tickets change
  React.useEffect(() => {
    if (supportTickets.length === 0) { setDetailsMap({}); return }
    setLoadingDetails(true)
    Promise.allSettled(
      supportTickets.map(t =>
        getSupportDetail(projectId, t.id)
          .then(d => ({ ticketId: t.id, detail: d }))
      )
    ).then(results => {
      const map: Record<string, ApiSupportDetail> = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.ticketId] = r.value.detail
      })
      setDetailsMap(map)
    }).finally(() => setLoadingDetails(false))
  }, [supportTickets, projectId])

  // Stats
  const stats = React.useMemo(() => {
    const open      = supportTickets.filter(t => ['todo', 'backlog'].includes(t.status)).length
    const inProgress = supportTickets.filter(t => t.status === 'in_progress').length
    const resolved  = supportTickets.filter(t => t.status === 'done').length
    const cancelled = supportTickets.filter(t => t.status === 'cancelled').length
    const overdue   = supportTickets.filter(t => {
      const d = detailsMap[t.id]
      return d && getSlaState(d.slaDeadline, !!d.resolvedAt) === 'overdue'
    }).length
    const totalUf   = Object.values(detailsMap).reduce((acc, d) => acc + (d.ufValue ?? 0), 0)
    const billedUf  = Object.values(detailsMap).reduce((acc, d) => acc + (d.billedAt ? (d.ufValue ?? 0) : 0), 0)
    return { total: supportTickets.length, open, inProgress, resolved, cancelled, overdue, totalUf, billedUf }
  }, [supportTickets, detailsMap])

  // Filtered list
  const filtered = React.useMemo(() => {
    return supportTickets.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.key.toLowerCase().includes(search.toLowerCase())) return false
      const d = detailsMap[t.id]
      if (billableFilter === 'billable' && (!d || !d.isBillable || !!d.billedAt)) return false
      if (billableFilter === 'non_billable' && (!d || d.isBillable)) return false
      if (billableFilter === 'billed' && (!d || !d.billedAt)) return false
      if (slaFilter === 'overdue') {
        const state = getSlaState(d?.slaDeadline ?? null, !!d?.resolvedAt)
        if (state !== 'overdue') return false
      }
      if (slaFilter === 'no_sla' && d?.slaDeadline) return false
      return true
    })
  }, [supportTickets, statusFilter, billableFilter, slaFilter, search, detailsMap])

  const handleRowClick = (ticket: ApiTicket) => {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  const handleOpenValorizar = (e: React.MouseEvent, ticket: ApiTicket) => {
    e.stopPropagation()
    setValorizarTicket(ticket)
    setValorizarOpen(true)
  }

  const handleValorizarSaved = (updatedTicket: ApiTicket, updatedDetail: ApiSupportDetail) => {
    onTicketUpdated(updatedTicket)
    setDetailsMap(prev => ({ ...prev, [updatedTicket.id]: updatedDetail }))
  }

  const handleUpdated = (updated: ApiTicket) => {
    onTicketUpdated(updated)
    // Refresh detail for this ticket
    getSupportDetail(projectId, updated.id)
      .then(d => setDetailsMap(prev => ({ ...prev, [updated.id]: d })))
      .catch(() => null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-sky-500" />
            Soportes
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestión de tickets de soporte técnico y facturación en UF
          </p>
        </div>
        <Button onClick={onCreateSupport} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo soporte
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Circle className="h-3.5 w-3.5 text-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Abiertos</span>
          </div>
          <p className="text-2xl font-bold">{stats.open}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Circle className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">En proceso</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Resueltos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{stats.resolved}</p>
        </Card>
        <Card className={cn("p-4", stats.overdue > 0 && "border-destructive/40 bg-destructive/5")}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={cn("h-3.5 w-3.5", stats.overdue > 0 ? "text-destructive" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground font-medium">Vencidos</span>
          </div>
          <p className={cn("text-2xl font-bold", stats.overdue > 0 ? "text-destructive" : "")}>
            {stats.overdue}
          </p>
        </Card>
        <Card className="p-4 bg-linear-to-br from-sky-500/5 to-blue-500/5 border-sky-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-xs text-muted-foreground font-medium">UF cobradas</span>
          </div>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {stats.billedUf.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {stats.totalUf.toFixed(2)}</span>
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por título o clave..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-56"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ApiTicket['status'] | 'all')}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', opt.dot)} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={billableFilter} onValueChange={v => setBillableFilter(v as BillableFilter)}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Cobro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="billable">Cobrables (pendientes)</SelectItem>
            <SelectItem value="non_billable">No cobrables</SelectItem>
            <SelectItem value="billed">Ya facturados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={slaFilter} onValueChange={v => setSlaFilter(v as SlaFilter)}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="SLA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los SLA</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
            <SelectItem value="no_sla">Sin SLA</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== 'all' || billableFilter !== 'all' || slaFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground"
            onClick={() => { setStatusFilter('all'); setBillableFilter('all'); setSlaFilter('all'); setSearch('') }}
          >
            Limpiar filtros
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {loadingDetails && <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Cargando detalles...</span>}
          {!loadingDetails && <span>{filtered.length} de {supportTickets.length} soportes</span>}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {supportTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10">
              <LifeBuoy className="h-8 w-8 text-sky-500/60" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sin soportes registrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea el primer ticket de soporte para este proyecto
              </p>
            </div>
            <Button onClick={onCreateSupport} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo soporte
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clave</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prior.</th>
                  <th className="w-36 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="w-36 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA</th>
                  <th className="w-20 px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">UF</th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cobro</th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asignado</th>
                  <th className="w-28 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                      No hay soportes que coincidan con los filtros
                    </td>
                  </tr>
                ) : filtered.map(ticket => {
                  const detail = detailsMap[ticket.id]
                  const statusCfg = STATUS_OPTIONS.find(s => s.value === ticket.status) ?? STATUS_OPTIONS[0]
                  const priorityCfg = PRIORITY_OPTIONS.find(p => p.value === ticket.priority) ?? PRIORITY_OPTIONS[2]
                  const assignee = teamMembers.find(m => m.id === ticket.assigneeId || m.userId === ticket.assigneeId)
                  const isBilled = !!detail?.billedAt
                  const isResolved = ticket.status === 'done' || !!detail?.resolvedAt

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(ticket)}
                    >
                      {/* Key */}
                      <td className="px-3 py-3">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.key}</span>
                      </td>

                      {/* Title */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-xs">{ticket.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.bg)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot,
                            ticket.status === 'in_progress' && 'animate-pulse'
                          )} />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3">
                        <span className={cn('flex items-center gap-1.5 text-xs font-medium', priorityCfg.color)}>
                          <span className={cn('w-2 h-2 rounded-full', priorityCfg.dot)} />
                          {priorityCfg.label}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-3 py-3">
                        {detail?.clientContact ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-25">{detail.clientContact}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="px-3 py-3">
                        <SlaIndicator
                          slaDeadline={detail?.slaDeadline ?? null}
                          resolved={isResolved}
                        />
                      </td>

                      {/* UF */}
                      <td className="px-3 py-3 text-right">
                        {detail?.ufValue != null ? (
                          <span className="text-xs font-semibold tabular-nums text-sky-600 dark:text-sky-400">
                            {Number(detail.ufValue).toFixed(2)} UF
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Billing */}
                      <td className="px-3 py-3">
                        {!detail?.isBillable ? (
                          <Badge variant="outline" className="text-[10px] h-5 gap-1 text-muted-foreground">
                            <Ban className="h-2.5 w-2.5" />No cobra
                          </Badge>
                        ) : isBilled ? (
                          <div>
                            <Badge className="text-[10px] h-5 gap-1 bg-emerald-500/15 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />Facturado
                            </Badge>
                            {detail.invoiceRef && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{detail.invoiceRef}</p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 gap-1 text-amber-600 border-amber-500/30 bg-amber-500/5">
                            <CalendarClock className="h-2.5 w-2.5" />Pendiente
                          </Badge>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback className="text-[10px]">
                                {assignee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-17.5">
                              {assignee.name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-border" />
                        )}
                      </td>

                      {/* Quick action: Valorizar */}
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        {ticket.status !== 'cancelled' && !isBilled && (
                          <Button
                            size="sm"
                            variant={ticket.status === 'done' ? 'default' : 'outline'}
                            className={cn(
                              'h-7 text-xs gap-1.5 whitespace-nowrap',
                              ticket.status === 'done' && 'bg-sky-600 hover:bg-sky-700 text-white border-0',
                            )}
                            onClick={e => handleOpenValorizar(e, ticket)}
                          >
                            <Coins className="h-3 w-3" />
                            Valorizar
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Footer totals */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={6} className="px-3 py-2.5 text-xs text-muted-foreground">
                      {filtered.length} soporte{filtered.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                        {filtered.reduce((acc, t) => acc + (detailsMap[t.id]?.ufValue ?? 0), 0).toFixed(2)} UF
                      </span>
                    </td>
                    <td colSpan={3} className="px-3 py-2.5 text-xs text-muted-foreground">
                      {filtered.filter(t => detailsMap[t.id]?.billedAt).length} facturados
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      {/* Detail sheet */}
      <SupportDetailSheet
        ticket={selectedTicket}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedTicket(null) }}
        projectId={projectId}
        teamMembers={teamMembers}
        onUpdated={handleUpdated}
      />

      {/* Valorizar dialog */}
      <ValorizarDialog
        open={valorizarOpen}
        onOpenChange={setValorizarOpen}
        ticket={valorizarTicket}
        currentDetail={valorizarTicket ? (detailsMap[valorizarTicket.id] ?? null) : null}
        projectId={projectId}
        onSaved={handleValorizarSaved}
      />
    </div>
  )
}
