'use client'

import { useState, useEffect } from 'react'
import {
  Activity, ActivityType, ActivityStatus, ActivityPriority,
  ACTIVITY_TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS,
} from '@/lib/types'
import { CountrySelector } from './CountrySelector'
import { cn } from '@/lib/utils'
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/lib/finance'
import { X, Save, Trash2, WalletCards, Loader2 } from 'lucide-react'
import { ActivityPhotosSection } from './ActivityPhotosSection'
import { uploadActivityPhoto } from '@/services/activityPhotoService'

export interface ActivityExpenseDraft {
  createExpense: boolean
  category: ExpenseCategory
  payerUserId: string
  participantUserIds: string[]
  exchangeRate?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (activity: Activity, finance: ActivityExpenseDraft) => Promise<Activity>
  onDelete?: (id: string) => void
  initialDate?: string
  activity?: Activity | null
  people: Array<{ id: string; label: string }>
  currentUserId: string
  baseCurrency: string
  tripId: string
}

const EMPTY_FORM: Omit<Activity, 'id'> = {
  title: '',
  type: 'sightseeing',
  date: '',
  startTime: '',
  endTime: '',
  countries: [],
  originCountry: '',
  destinationCountry: '',
  city: '',
  location: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  link: '',
  price: '',
  priceCurrency: 'USD',
  priceType: 'total',
  financialStatus: 'estimated',
  financialParticipantUserIds: [],
  financialPayerUserId: '',
  paidAt: '',
  paymentReferenceUrl: '',
}

function activityTypeCategory(type: ActivityType): ExpenseCategory {
  if (['flight', 'train', 'bus', 'transfer'].includes(type)) return 'transport'
  if (type === 'accommodation') return 'accommodation'
  if (type === 'food') return 'food'
  if (type === 'shopping') return 'shopping'
  if (type === 'document') return 'documentation'
  return type === 'sightseeing' ? 'activities' : 'other'
}

export function ActivityFormModal({ open, onClose, onSave, onDelete, initialDate, activity, people, currentUserId, baseCurrency, tripId }: Props) {
  const [form, setForm] = useState<Omit<Activity, 'id'>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({})
  const [createExpense, setCreateExpense] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('activities')
  const [payerUserId, setPayerUserId] = useState(currentUserId)
  const [participantUserIds, setParticipantUserIds] = useState<string[]>([])
  const [exchangeRate, setExchangeRate] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [stagedPhotos, setStagedPhotos] = useState<File[]>([])

  useEffect(() => {
    if (activity) {
      const rest = { ...activity }
      delete (rest as Partial<Activity>).id
      setForm(rest)
    } else {
      setForm({ ...EMPTY_FORM, date: initialDate ?? '' })
    }
    setErrors({})
    setCreateExpense(false)
    setExpenseCategory(activityTypeCategory(activity?.type ?? 'sightseeing'))
    setPayerUserId(activity?.financialPayerUserId ?? currentUserId)
    setParticipantUserIds(activity?.financialParticipantUserIds?.length ? activity.financialParticipantUserIds : people.map(person => person.id))
    setExchangeRate('')
    setSubmitError('')
    setStagedPhotos([])
  }, [activity, initialDate, open, currentUserId, people])

  if (!open) return null

  const isTransit = form.type === 'flight' || form.type === 'train' || form.type === 'bus' || form.type === 'transfer'

  function validate(): boolean {
    const newErrors: Partial<Record<keyof typeof EMPTY_FORM, string>> = {}
    const linkVal = form.link?.trim()
    if (linkVal) {
      try {
        new URL(linkVal)
      } catch {
        newErrors.link = 'Ingresa una URL válida (ej: https://booking.com/…)'
      }
    }
    if (createExpense && !form.price) newErrors.price = 'Ingresa un precio para crear el gasto.'
    if (createExpense && participantUserIds.length === 0) newErrors.price = 'Selecciona al menos un participante.'
    if (createExpense && form.priceCurrency !== baseCurrency && !exchangeRate) newErrors.price = `Ingresa el tipo de cambio hacia ${baseCurrency}.`
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Strip empty optional fields to avoid API validation errors
    const payload: Omit<Activity, 'id'> = {
      ...form,
      startTime: form.startTime?.trim() || undefined,
      endTime: form.endTime?.trim() || undefined,
      link: form.link?.trim() || undefined,
      price: form.price?.trim() || undefined,
      paidAt: form.paidAt?.trim() || undefined,
      paymentReferenceUrl: form.paymentReferenceUrl?.trim() || undefined,
      financialPayerUserId: form.financialPayerUserId?.trim() || undefined,
      financialParticipantUserIds: createExpense ? participantUserIds : form.financialParticipantUserIds,
    }

    if (createExpense) payload.financialPayerUserId = payerUserId

    const id = activity?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    try {
      setSaving(true)
      setSubmitError('')
      const saved = await onSave({ id, ...payload }, { createExpense, category: expenseCategory, payerUserId, participantUserIds, exchangeRate: exchangeRate || undefined })
      const failed: File[] = []
      for (const [index, photo] of stagedPhotos.entries()) {
        try { await uploadActivityPhoto(photo, saved.id, tripId, { sortOrder: index }) }
        catch { failed.push(photo) }
      }
      if (failed.length) {
        setStagedPhotos(failed)
        setSubmitError(`La actividad quedó guardada, pero ${failed.length} fotografía(s) fallaron. Puedes volver a guardar para reintentarlas.`)
        return
      }
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la actividad.')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleParticipant(id: string) {
    setParticipantUserIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={activity ? 'Editar actividad' : 'Nueva actividad'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {activity ? 'Editar actividad' : 'Nueva actividad'}
          </h2>
          <div className="flex items-center gap-2">
            {activity && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(activity.id); onClose() }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Eliminar actividad"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Título <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Ej: Visita al Coliseo"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="type" className="text-sm font-medium text-foreground">Tipo</label>
                <select
                  id="type"
                  value={form.type}
                  onChange={e => { const type = e.target.value as ActivityType; setField('type', type); setExpenseCategory(activityTypeCategory(type)) }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-sm font-medium text-foreground">Estado</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={e => setField('status', e.target.value as ActivityStatus)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {(Object.entries(STATUS_LABELS) as [ActivityStatus, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date" className="text-sm font-medium text-foreground">
                  Fecha <span className="text-destructive">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setField('date', e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="priority" className="text-sm font-medium text-foreground">Prioridad</label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={e => setField('priority', e.target.value as ActivityPriority)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {(Object.entries(PRIORITY_LABELS) as [ActivityPriority, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start & End times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="startTime" className="text-sm font-medium text-foreground">Hora inicio</label>
                <input
                  id="startTime"
                  type="time"
                  value={form.startTime ?? ''}
                  onChange={e => setField('startTime', e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="endTime" className="text-sm font-medium text-foreground">Hora término (opcional)</label>
                <input
                  id="endTime"
                  type="time"
                  value={form.endTime ?? ''}
                  onChange={e => setField('endTime', e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>

            {/* Countries */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Países</label>
              <CountrySelector
                value={form.countries}
                onChange={v => setField('countries', v)}
              />
            </div>

            {/* Transit: origin/destination */}
            {isTransit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">País de origen</label>
                  <CountrySelector
                    value={form.originCountry ? [form.originCountry] : []}
                    onChange={v => setField('originCountry', v[0] ?? '')}
                    multiple={false}
                    placeholder="País de origen"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">País de destino</label>
                  <CountrySelector
                    value={form.destinationCountry ? [form.destinationCountry] : []}
                    onChange={v => setField('destinationCountry', v[0] ?? '')}
                    multiple={false}
                    placeholder="País de destino"
                  />
                </div>
              </div>
            )}

            {/* City & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className="text-sm font-medium text-foreground">Ciudad (opcional)</label>
                <input
                  id="city"
                  type="text"
                  value={form.city ?? ''}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Ej: Roma"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="location" className="text-sm font-medium text-foreground">Lugar / dirección (opcional)</label>
                <input
                  id="location"
                  type="text"
                  value={form.location ?? ''}
                  onChange={e => setField('location', e.target.value)}
                  placeholder="Ej: Via Sacra, Roma"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-foreground">Descripción / notas (opcional)</label>
              <textarea
                id="description"
                rows={3}
                value={form.description ?? ''}
                onChange={e => setField('description', e.target.value)}
                placeholder="Notas o detalles adicionales..."
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Link */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Información financiera</p><WalletCards className="size-4 text-primary" /></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><label className="mb-1 block text-xs">Precio</label><input type="number" min="0" step="0.01" value={form.price ?? ''} onChange={e => setField('price', e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs">Moneda</label><select value={form.priceCurrency ?? 'USD'} onChange={e => setField('priceCurrency', e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"><option>USD</option><option>EUR</option><option>CLP</option><option>GBP</option><option>CHF</option></select></div>
                <div><label className="mb-1 block text-xs">Tipo</label><select value={form.priceType ?? 'total'} onChange={e => setField('priceType', e.target.value as 'total'|'per_person')} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"><option value="total">Total</option><option value="per_person">Por persona</option></select></div>
                <div><label className="mb-1 block text-xs">Estado</label><select value={form.financialStatus ?? 'estimated'} onChange={e => setField('financialStatus', e.target.value as 'estimated'|'reserved'|'partial'|'paid')} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"><option value="estimated">Estimado</option><option value="reserved">Reservado</option><option value="partial">Pago parcial</option><option value="paid">Pagado</option></select></div>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-3"><input type="checkbox" checked={createExpense} onChange={event => setCreateExpense(event.target.checked)} className="mt-0.5 size-4 accent-primary"/><span><strong className="block text-sm">Agregar también a Finanzas</strong><span className="text-xs text-muted-foreground">Al guardar, se creará un gasto vinculado y no tendrás que ingresarlo nuevamente.</span></span></label>
              {createExpense && <div className="mt-3 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-xs font-semibold">Categoría del gasto</label><select value={expenseCategory} onChange={event => setExpenseCategory(event.target.value as ExpenseCategory)} className="w-full rounded-lg border bg-background px-2 py-2 text-sm">{Object.entries(EXPENSE_CATEGORIES).map(([key,value]) => <option key={key} value={key}>{value.icon} {value.label}</option>)}</select></div><div><label className="mb-1 block text-xs font-semibold">Quién paga</label><select value={payerUserId} onChange={event => setPayerUserId(event.target.value)} className="w-full rounded-lg border bg-background px-2 py-2 text-sm">{people.map(person => <option key={person.id} value={person.id}>{person.label}</option>)}</select></div></div>
                <div><label className="mb-2 block text-xs font-semibold">Participantes incluidos</label><div className="flex flex-wrap gap-2">{people.map(person => <button type="button" key={person.id} onClick={() => toggleParticipant(person.id)} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', participantUserIds.includes(person.id) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')}>{person.label}</button>)}</div></div>
                {form.priceCurrency !== baseCurrency && <div><label className="mb-1 block text-xs font-semibold">1 {form.priceCurrency} equivale a cuántos {baseCurrency}</label><input type="number" min="0.000001" step="0.000001" value={exchangeRate} onChange={event => setExchangeRate(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Tipo de cambio manual"/></div>}
                <p className="text-[11px] text-muted-foreground">{form.priceType === 'per_person' ? `El gasto total será el precio por persona multiplicado por ${participantUserIds.length || 0}.` : 'El monto se dividirá en partes iguales entre los participantes.'}</p>
              </div>}
              {!createExpense && <p className="mt-2 text-[11px] text-muted-foreground">El precio queda como planificación y no afecta balances. Puedes convertirlo en gasto más adelante desde Finanzas.</p>}
              {errors.price && <p className="mt-2 text-xs text-destructive">{errors.price}</p>}
            </div>

            {/* Link */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="link" className="text-sm font-medium text-foreground">Enlace (reserva, ticket, mapa…)</label>
              <input
                id="link"
                type="text"
                value={form.link ?? ''}
                onChange={e => {
                  setField('link', e.target.value)
                  if (errors.link) setErrors(prev => ({ ...prev, link: undefined }))
                }}
                placeholder="https://..."
                className={cn(
                  'rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors',
                  errors.link
                    ? 'border-destructive focus:ring-destructive/50'
                    : 'border-input focus:ring-ring/50'
                )}
              />
              {errors.link && (
                <p className="text-xs text-destructive">{errors.link}</p>
              )}
            </div>
          </div>

          <div className="px-6 pb-5">
            <ActivityPhotosSection activityId={activity?.id} staged={stagedPhotos} onStagedChange={setStagedPhotos} disabled={saving} />
          </div>

          {/* Footer */}
          {submitError && <p className="mx-6 mb-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {createExpense ? 'Guardar actividad y gasto' : activity ? 'Guardar cambios' : 'Crear actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
