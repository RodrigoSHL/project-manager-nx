'use client'

import * as React from 'react'
import { Loader2, LifeBuoy, AlertCircle, CheckCircle2, Ban } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { updateSupportDetail } from '@/services/supportDetailService'
import { updateTicket } from '@/services/ticketService'
import type { ApiTicket, ApiSupportDetail } from '@/types/project'

// ─── UF preset buttons ────────────────────────────────────────────────────────

const UF_PRESETS = [0.5, 1, 1.5, 2, 3, 5]

interface ValorizarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: ApiTicket | null
  currentDetail: ApiSupportDetail | null
  projectId: string
  onSaved: (ticket: ApiTicket, detail: ApiSupportDetail) => void
}

export function ValorizarDialog({
  open,
  onOpenChange,
  ticket,
  currentDetail,
  projectId,
  onSaved,
}: ValorizarDialogProps) {
  const [isBillable, setIsBillable] = React.useState(true)
  const [ufValue, setUfValue]       = React.useState('')
  const [invoiceRef, setInvoiceRef] = React.useState('')
  const [billedAt, setBilledAt]     = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [saving, setSaving]   = React.useState(false)
  const [error, setError]     = React.useState('')

  // Populate from existing detail
  React.useEffect(() => {
    if (!open) { setError(''); return }
    setIsBillable(currentDetail?.isBillable ?? true)
    setUfValue(currentDetail?.ufValue != null ? String(currentDetail.ufValue) : '')
    setInvoiceRef(currentDetail?.invoiceRef ?? '')
    setBilledAt(
      currentDetail?.billedAt
        ? currentDetail.billedAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    )
  }, [open, currentDetail])

  const handleSave = async () => {
    if (!ticket) return
    setSaving(true)
    setError('')
    try {
      const detailPayload = {
        isBillable,
        ufValue:    isBillable && ufValue ? parseFloat(ufValue) : null,
        invoiceRef: isBillable && invoiceRef.trim() ? invoiceRef.trim() : null,
        billedAt:   isBillable && billedAt ? billedAt : null,
        resolvedAt: currentDetail?.resolvedAt ?? new Date().toISOString(),
      }

      const [updatedTicket, updatedDetail] = await Promise.all([
        // mark done if not already
        ticket.status !== 'done'
          ? updateTicket(projectId, ticket.id, { status: 'done' })
          : Promise.resolve(ticket),
        updateSupportDetail(projectId, ticket.id, detailPayload as Parameters<typeof updateSupportDetail>[2]),
      ])

      onSaved(updatedTicket, updatedDetail)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500/10 shrink-0">
              <LifeBuoy className="h-4.5 w-4.5 text-sky-500" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">Valorizar soporte</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">{ticket?.key} · {ticket?.title}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Billable toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">¿Este soporte se cobra?</p>
              <p className="text-xs text-muted-foreground">
                {isBillable ? 'Sí, se generará cobro al cliente' : 'Soporte sin costo para el cliente'}
              </p>
            </div>
            <Switch checked={isBillable} onCheckedChange={setIsBillable} />
          </div>

          {isBillable ? (
            <>
              {/* UF Value */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor en UF</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">
                    UF
                  </span>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="0.00"
                    className="pl-9 text-base font-semibold"
                    value={ufValue}
                    onChange={e => setUfValue(e.target.value)}
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {UF_PRESETS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setUfValue(String(v))}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-lg border font-medium transition-all',
                        ufValue === String(v)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40 hover:bg-accent/40',
                      )}
                    >
                      {v} UF
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Invoice info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fecha de cobro</Label>
                  <Input
                    type="date"
                    value={billedAt}
                    onChange={e => setBilledAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">N° Factura / Boleta</Label>
                  <Input
                    placeholder="FAC-2026-0042"
                    value={invoiceRef}
                    onChange={e => setInvoiceRef(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              {ufValue && parseFloat(ufValue) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
                  <span className="text-sm text-muted-foreground">Total a cobrar</span>
                  <span className="text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {parseFloat(ufValue).toFixed(2)} UF
                  </span>
                </div>
              )}
            </>
          ) : (
            /* No charge state */
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border">
              <Ban className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Este soporte quedará marcado como sin costo. El ticket se cerrará como resuelto.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (isBillable && !ufValue)}
            className="gap-2 min-w-36"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
            ) : isBillable ? (
              <><CheckCircle2 className="h-4 w-4" /> Cobrar y cerrar</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Cerrar sin cobro</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
