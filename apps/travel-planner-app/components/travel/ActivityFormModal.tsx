'use client'

import { useState, useEffect } from 'react'
import {
  Activity, ActivityType, ActivityStatus, ActivityPriority,
  ACTIVITY_TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS,
} from '@/lib/types'
import { CountrySelector } from './CountrySelector'
import { cn } from '@/lib/utils'
import { X, Save, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  onDelete?: (id: string) => void
  initialDate?: string
  activity?: Activity | null
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
}

export function ActivityFormModal({ open, onClose, onSave, onDelete, initialDate, activity }: Props) {
  const [form, setForm] = useState<Omit<Activity, 'id'>>(EMPTY_FORM)

  useEffect(() => {
    if (activity) {
      const { id, ...rest } = activity
      setForm(rest)
    } else {
      setForm({ ...EMPTY_FORM, date: initialDate ?? '' })
    }
  }, [activity, initialDate, open])

  if (!open) return null

  const isTransit = form.type === 'flight' || form.type === 'train' || form.type === 'bus' || form.type === 'transfer'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = activity?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    onSave({ id, ...form })
    onClose()
  }

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
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
                  onChange={e => setField('type', e.target.value as ActivityType)}
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="link" className="text-sm font-medium text-foreground">Enlace (reserva, ticket, mapa…)</label>
              <input
                id="link"
                type="url"
                value={form.link ?? ''}
                onChange={e => setField('link', e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {/* Footer */}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              {activity ? 'Guardar cambios' : 'Crear actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
