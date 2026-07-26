'use client'

import { useEffect, useState } from 'react'
import { Archive, ChevronDown, Loader2, Ruler, Save, Scale, Trash2, X } from 'lucide-react'
import { Luggage, LuggageInput, LuggageType } from '@/services/luggageService'
import { LUGGAGE_PRESETS, LUGGAGE_TYPES, luggageIcon } from './luggage-ui'

interface Props {
  open: boolean
  luggage?: Luggage | null
  preset?: LuggageInput | null
  onClose: () => void
  onSave: (data: LuggageInput) => Promise<void>
  onArchive?: () => Promise<void>
  onDelete?: () => Promise<void>
}

const EMPTY: LuggageInput = {
  name: '',
  type: 'carry_on',
  color: '#0ea5e9',
  emptyWeight: 0,
  cabinCompatible: true,
  personalItemCompatible: false,
  checkedBaggage: false,
}

export function LuggageFormModal({ open, luggage, preset, onClose, onSave, onArchive, onDelete }: Props) {
  const [form, setForm] = useState<LuggageInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (luggage) {
      setForm({
        name: luggage.name,
        type: luggage.type,
        image: luggage.image,
        color: luggage.color,
        brand: luggage.brand,
        model: luggage.model,
        capacityLiters: luggage.capacityLiters,
        emptyWeight: luggage.emptyWeight,
        maxWeight: luggage.maxWeight,
        dimensions: luggage.dimensions,
        cabinCompatible: luggage.cabinCompatible,
        personalItemCompatible: luggage.personalItemCompatible,
        checkedBaggage: luggage.checkedBaggage,
        notes: luggage.notes,
      })
    } else {
      setForm(preset ?? EMPTY)
    }
    setError(null)
  }, [luggage, open, preset])

  if (!open) return null

  const Icon = luggageIcon(form.type)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const dimensions = form.dimensions
      const completeDimensions = dimensions?.height && dimensions.width && dimensions.depth
        ? dimensions
        : undefined
      await onSave({ ...form, dimensions: completeDimensions })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar esta maleta.')
    } finally {
      setSaving(false)
    }
  }

  async function archive() {
    if (!onArchive) return
    setSaving(true)
    setError(null)
    try {
      await onArchive()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos archivar esta maleta.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!onDelete || !window.confirm('¿Eliminar esta maleta definitivamente? Se quitará de todos tus viajes, pero los artículos de tus listas se conservarán sin maleta asignada.')) return
    setSaving(true)
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar esta maleta.')
    } finally {
      setSaving(false)
    }
  }

  function numberValue(value: string) {
    return value === '' ? undefined : Number(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="luggage-form-title">
      <button className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <section className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-card shadow-2xl sm:max-w-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: form.color }}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Mi equipaje</p>
              <h2 id="luggage-form-title" className="text-xl font-bold tracking-tight">{luggage ? 'Editar maleta' : 'Agregar maleta'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:text-foreground" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto">
          <div className="space-y-5 p-5 sm:p-7">
            {!luggage && !preset && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Comenzar con un tipo rápido</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {LUGGAGE_PRESETS.map(option => (
                    <button key={option.label} type="button" onClick={() => setForm(option.data)} className="min-w-36 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-primary/[0.03]">
                      <span className="block text-xs font-semibold">{option.label}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium">Nombre</span>
                <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Ej. Carry-on azul" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Tipo</span>
                <select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as LuggageType }))} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10">
                  {Object.entries(LUGGAGE_TYPES).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Color</span>
                <span className="flex h-11 items-center gap-3 rounded-xl border border-input bg-background px-3">
                  <input type="color" value={form.color} onChange={event => setForm(current => ({ ...current, color: event.target.value }))} className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                  <span className="text-sm text-muted-foreground">{form.color}</span>
                </span>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Capacidad aproximada</span>
                <span className="relative block">
                  <input type="number" min="1" value={form.capacityLiters ?? ''} onChange={event => setForm(current => ({ ...current, capacityLiters: numberValue(event.target.value) }))} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 pr-10 text-sm outline-none focus:ring-4 focus:ring-primary/10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">L</span>
                </span>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Peso vacío</span>
                <span className="relative block">
                  <input type="number" min="0" step="0.1" value={form.emptyWeight} onChange={event => setForm(current => ({ ...current, emptyWeight: Number(event.target.value) }))} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 pr-10 text-sm outline-none focus:ring-4 focus:ring-primary/10" />
                  <Scale className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['personalItemCompatible', 'Debajo del asiento'],
                ['cabinCompatible', 'Puede ir en cabina'],
                ['checkedBaggage', 'Equipaje facturado'],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm font-medium">
                  <input type="checkbox" checked={Boolean(form[key as keyof LuggageInput])} onChange={event => setForm(current => ({ ...current, [key]: event.target.checked }))} className="size-4 accent-primary" />
                  {label}
                </label>
              ))}
            </div>

            <details className="group rounded-2xl border border-border bg-muted/20">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
                Detalles opcionales
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-xs font-medium">Marca</span><input value={form.brand ?? ''} onChange={event => setForm(current => ({ ...current, brand: event.target.value }))} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
                <label><span className="mb-1 block text-xs font-medium">Modelo</span><input value={form.model ?? ''} onChange={event => setForm(current => ({ ...current, model: event.target.value }))} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
                <label><span className="mb-1 block text-xs font-medium">Peso máximo</span><input type="number" step="0.1" value={form.maxWeight ?? ''} onChange={event => setForm(current => ({ ...current, maxWeight: numberValue(event.target.value) }))} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
                <div>
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium"><Ruler className="size-3" /> Dimensiones (cm)</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['height', 'width', 'depth'] as const).map((dimension, index) => <input key={dimension} type="number" min="1" placeholder={['Alto', 'Ancho', 'Fondo'][index]} value={form.dimensions?.[dimension] ?? ''} onChange={event => setForm(current => ({ ...current, dimensions: { height: current.dimensions?.height ?? 0, width: current.dimensions?.width ?? 0, depth: current.dimensions?.depth ?? 0, [dimension]: Number(event.target.value) } }))} className="h-10 min-w-0 rounded-xl border border-input bg-background px-2 text-xs" />)}
                  </div>
                </div>
                <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium">Notas</span><textarea rows={3} value={form.notes ?? ''} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm" /></label>
              </div>
            </details>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-7">
            {luggage ? (
              <div className="flex items-center gap-1">
                {onArchive && <button type="button" disabled={saving} onClick={archive} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"><Archive className="size-4" /> Archivar</button>}
                {onDelete && <button type="button" disabled={saving} onClick={remove} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-4" /> Eliminar</button>}
              </div>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={saving} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Guardar
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
