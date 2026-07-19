'use client'

import { useEffect, useState } from 'react'
import { Loader2, PackagePlus, Save, X } from 'lucide-react'
import { PackingCategory, PackingItem, TripLuggage } from '@/services/luggageService'
import { CATEGORY_META } from './luggage-ui'

interface Props {
  open: boolean
  item?: PackingItem | null
  luggage: TripLuggage[]
  onClose: () => void
  onSave: (data: Partial<PackingItem> & Pick<PackingItem, 'name' | 'category'>) => Promise<void>
}

export function PackingItemModal({ open, item, luggage, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PackingCategory>('other')
  const [quantity, setQuantity] = useState(1)
  const [luggageId, setLuggageId] = useState('')
  const [estimatedWeight, setEstimatedWeight] = useState(0)
  const [purchaseRequired, setPurchaseRequired] = useState(false)
  const [shared, setShared] = useState(false)
  const [packMoment, setPackMoment] = useState<PackingItem['packMoment']>('advance')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setCategory(item?.category ?? 'other')
    setQuantity(item?.quantity ?? 1)
    setLuggageId(item?.luggageId ?? '')
    setEstimatedWeight(item?.estimatedWeight ?? 0)
    setPurchaseRequired(item?.purchaseRequired ?? false)
    setShared(item?.shared ?? false)
    setPackMoment(item?.packMoment ?? 'advance')
    setError(null)
  }, [item, open])

  if (!open) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ name, category, quantity, luggageId: luggageId || null, estimatedWeight, purchaseRequired, shared, packMoment })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar el artículo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="packing-item-title">
      <button className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <section className="relative z-10 w-full rounded-t-[28px] border border-white/70 bg-card shadow-2xl sm:max-w-lg sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackagePlus className="size-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Checklist</p><h2 id="packing-item-title" className="text-lg font-bold">{item ? 'Editar artículo' : 'Agregar artículo'}</h2></div></div>
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-label="Cerrar"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit}>
          <div className="grid max-h-[70dvh] gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
            <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Artículo</span><input required autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Cargador del reloj" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10" /></label>
            <label><span className="mb-1.5 block text-sm font-medium">Categoría</span><select value={category} onChange={event => setCategory(event.target.value as PackingCategory)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{Object.entries(CATEGORY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
            <label><span className="mb-1.5 block text-sm font-medium">Guardar en</span><select value={luggageId} onChange={event => setLuggageId(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Sin asignar</option>{luggage.map(entry => <option key={entry.id} value={entry.id}>{entry.luggage.name}</option>)}</select></label>
            <label><span className="mb-1.5 block text-sm font-medium">Cantidad</span><input type="number" min="1" max="100" value={quantity} onChange={event => setQuantity(Number(event.target.value))} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
            <label><span className="mb-1.5 block text-sm font-medium">Peso total estimado</span><div className="relative"><input type="number" min="0" step="0.01" value={estimatedWeight} onChange={event => setEstimatedWeight(Number(event.target.value))} className="h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span></div></label>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Cuándo guardarlo</span><select value={packMoment} onChange={event => setPackMoment(event.target.value as PackingItem['packMoment'])} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="advance">Con anticipación</option><option value="week_before">Una semana antes</option><option value="day_before">El día anterior</option><option value="same_day">El mismo día</option><option value="before_leaving">Justo antes de salir</option></select></label>
            <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm font-medium"><input type="checkbox" checked={purchaseRequired} onChange={event => setPurchaseRequired(event.target.checked)} className="size-4 accent-primary" />Necesito comprarlo</label><label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm font-medium"><input type="checkbox" checked={shared} onChange={event => setShared(event.target.checked)} className="size-4 accent-primary" />Artículo compartido</label></div>
            {error && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-sm font-medium">Cancelar</button><button type="submit" disabled={saving} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Guardar</button></div>
        </form>
      </section>
    </div>
  )
}
