'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Archive, Backpack, Check, CheckCircle2, ChevronRight, Circle, Copy, Edit3, Loader2, Luggage as LuggageIcon, PackageCheck, Plus, RotateCcw, Search, ShoppingCart, Sparkles } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Trip } from '@/services/tripService'
import { Luggage, LuggageInput, PackingDashboard, PackingItem, TripLuggage, luggageApi } from '@/services/luggageService'
import { cn } from '@/lib/utils'
import { CATEGORY_META, LUGGAGE_PRESETS, LUGGAGE_TYPES, luggageIcon } from './luggage-ui'
import { LuggageFormModal } from './LuggageFormModal'
import { PackingItemModal } from './PackingItemModal'
import { PackingWizard } from './PackingWizard'

type Tab = 'bags' | 'packing' | 'before-leaving'
type QuickFilter = 'all' | 'to-buy' | 'missing-pack' | 'packed' | 'essential' | 'unassigned'

interface Props {
  trip: Trip
  currentUserId: string
  canEditTrip: boolean
}

export function LuggageSection({ trip, currentUserId, canEditTrip }: Props) {
  const [tab, setTab] = useState<Tab>('bags')
  const [luggage, setLuggage] = useState<Luggage[]>([])
  const [tripLuggage, setTripLuggage] = useState<TripLuggage[]>([])
  const [items, setItems] = useState<PackingItem[]>([])
  const [dashboard, setDashboard] = useState<PackingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bagModalOpen, setBagModalOpen] = useState(false)
  const [editingBag, setEditingBag] = useState<Luggage | null>(null)
  const [bagPreset, setBagPreset] = useState<LuggageInput | null>(null)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [filter, setFilter] = useState<QuickFilter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [allLuggage, selectedLuggage, packingItems, packingDashboard] = await Promise.all([
        luggageApi.list(),
        luggageApi.listForTrip(trip.id),
        luggageApi.listItems(trip.id),
        luggageApi.dashboard(trip.id),
      ])
      setLuggage(allLuggage)
      setTripLuggage(selectedLuggage)
      setItems(packingItems)
      setDashboard(packingDashboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tu equipaje.')
    } finally {
      setLoading(false)
    }
  }, [trip.id])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return 7
    return Math.max(1, differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1)
  }, [trip.endDate, trip.startDate])

  const visibleItems = useMemo(() => items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'to-buy') return item.purchaseRequired || item.status === 'to_buy'
    if (filter === 'missing-pack') return item.haveIt && !item.packed
    if (filter === 'packed') return item.packed
    if (filter === 'essential') return item.priority === 'essential'
    if (filter === 'unassigned') return !item.luggageId
    return item.status !== 'skipped'
  }), [filter, items, search])

  const categoryGroups = useMemo(() => {
    return visibleItems.reduce<Record<string, PackingItem[]>>((groups, item) => {
      groups[item.category] = [...(groups[item.category] ?? []), item]
      return groups
    }, {})
  }, [visibleItems])

  async function saveBag(data: LuggageInput) {
    if (editingBag) await luggageApi.update(editingBag.id, data)
    else await luggageApi.create(data)
    await refresh()
  }

  function openNewBag(preset?: LuggageInput) {
    setEditingBag(null)
    setBagPreset(preset ?? null)
    setBagModalOpen(true)
  }

  async function toggleTripLuggage(bag: Luggage) {
    setBusyId(bag.id)
    try {
      const assignment = tripLuggage.find(entry => entry.luggageId === bag.id)
      if (assignment) await luggageApi.removeFromTrip(trip.id, assignment.id)
      else await luggageApi.addToTrip(trip.id, bag.id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function saveItem(data: Partial<PackingItem> & Pick<PackingItem, 'name' | 'category'>) {
    if (editingItem) await luggageApi.updateItem(trip.id, editingItem.id, data)
    else await luggageApi.createItem(trip.id, data)
    await refresh()
  }

  async function patchItem(item: PackingItem, data: Partial<PackingItem>) {
    setBusyId(item.id)
    setItems(current => current.map(entry => entry.id === item.id ? { ...entry, ...data } : entry))
    try {
      await luggageApi.updateItem(trip.id, item.id, data)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos actualizar el artículo.')
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function removeItem(item: PackingItem) {
    setBusyId(item.id)
    try {
      await luggageApi.removeItem(trip.id, item.id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Preparando tu equipaje…</div>

  return (
    <section className="relative space-y-5 pb-24 sm:pb-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {[
          ['bags', LuggageIcon, 'Mis maletas'],
          ['packing', PackageCheck, 'Preparar viaje'],
          ['before-leaving', CheckCircle2, 'Antes de salir'],
        ].map(([value, Icon, label]) => (
          <button key={value as string} onClick={() => setTab(value as Tab)} className={cn('flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition', tab === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            {typeof Icon !== 'string' && <Icon className="size-4" />}{label as string}
          </button>
        ))}
      </div>

      {error && <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}<button onClick={refresh} className="ml-auto font-semibold underline">Reintentar</button></div>}

      {tab === 'bags' && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Inventario personal</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Mis maletas</h2><p className="mt-1 text-sm text-muted-foreground">Registra una vez y reutiliza en todos tus viajes.</p></div>
            <button onClick={() => openNewBag()} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"><Plus className="size-4" /> Agregar maleta</button>
          </div>

          {luggage.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-border bg-card p-6 sm:p-8">
              <div className="mx-auto max-w-lg text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Backpack className="size-7" /></div><h3 className="mt-4 text-lg font-bold">Comienza con tu equipaje habitual</h3><p className="mt-1 text-sm text-muted-foreground">Elige un tipo rápido y podrás ajustar sus detalles.</p></div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{LUGGAGE_PRESETS.map(preset => <button key={preset.label} onClick={() => openNewBag(preset.data)} className="rounded-2xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><strong className="block text-sm">{preset.label}</strong><span className="mt-1 block text-xs text-muted-foreground">{preset.description}</span><ChevronRight className="mt-3 size-4 text-primary" /></button>)}</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{luggage.map(bag => <LuggageCard key={bag.id} luggage={bag} activeItems={items.filter(item => tripLuggage.find(entry => entry.id === item.luggageId)?.luggageId === bag.id).length} selected={tripLuggage.some(entry => entry.luggageId === bag.id)} selecting={busyId === bag.id} canSelect={canEditTrip} onToggle={() => toggleTripLuggage(bag)} onEdit={() => { setEditingBag(bag); setBagPreset(null); setBagModalOpen(true) }} onDuplicate={async () => { await luggageApi.duplicate(bag.id); await refresh() }} />)}</div>
          )}
        </div>
      )}

      {tab === 'packing' && items.length === 0 && canEditTrip && (
        <PackingWizard
          tripDays={tripDays}
          luggage={luggage}
          selected={tripLuggage.filter(entry => entry.ownerId === currentUserId)}
          onToggleLuggage={toggleTripLuggage}
          onCreateLuggage={() => openNewBag()}
          onGenerate={async input => { await luggageApi.generate(trip.id, input); await refresh() }}
        />
      )}

      {tab === 'packing' && items.length === 0 && !canEditTrip && (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-14 text-center">
          <LuggageIcon className="mx-auto size-9 text-muted-foreground/50" />
          <h2 className="mt-3 font-bold">Aún no hay una lista de equipaje</h2>
          <p className="mt-1 text-sm text-muted-foreground">Una persona con permiso de edición puede preparar la propuesta para este viaje.</p>
        </div>
      )}

      {tab === 'packing' && items.length > 0 && dashboard && (
        <div className="space-y-5">
          <PackingOverview dashboard={dashboard} />

          <div className="space-y-3">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Equipaje del viaje</h2><p className="text-sm text-muted-foreground">Peso y avance por maleta.</p></div><button onClick={() => setTab('bags')} className="text-sm font-semibold text-primary">Administrar</button></div>
            <div className="flex gap-3 overflow-x-auto pb-2">{dashboard.luggage.map(entry => <WeightCard key={entry.id} entry={entry} onWeight={async value => { await luggageApi.updateTripLuggage(trip.id, entry.id, { actualWeight: value }); await refresh() }} />)}</div>
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{dashboard.airlineNotice}</p>
          </div>

          <div className="sticky top-2 z-20 space-y-2 rounded-2xl border border-border bg-card/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar en tu equipaje…" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-4 focus:ring-primary/10" /></div>
            <div className="flex gap-1.5 overflow-x-auto">{[
              ['all', 'Todo'], ['to-buy', 'Por comprar'], ['missing-pack', 'Falta guardar'], ['packed', 'Guardado'], ['essential', 'Esencial'], ['unassigned', 'Sin maleta'],
            ].map(([value, label]) => <button key={value} onClick={() => setFilter(value as QuickFilter)} className={cn('min-w-fit rounded-full px-3 py-1.5 text-xs font-semibold', filter === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{label}</button>)}</div>
          </div>

          <div className="space-y-4">{Object.entries(categoryGroups).map(([category, categoryItems]) => <PackingCategoryGroup key={category} category={category as PackingItem['category']} items={categoryItems} luggage={tripLuggage} currentUserId={currentUserId} canEditTrip={canEditTrip} busyId={busyId} onPatch={patchItem} onEdit={item => { setEditingItem(item); setItemModalOpen(true) }} onRemove={removeItem} />)}</div>
          {visibleItems.length === 0 && <div className="rounded-2xl border border-dashed border-border py-12 text-center"><PackageCheck className="mx-auto size-7 text-muted-foreground/50" /><p className="mt-2 text-sm font-medium">No hay artículos para este filtro.</p></div>}

          {canEditTrip && <button onClick={async () => { if (window.confirm('Esto reemplazará tu lista actual. ¿Continuar?')) { await luggageApi.generate(trip.id, { customDays: tripDays, climate: 'mixed', activities: ['city'], laundryAccess: tripDays > 10, laundryEveryDays: 7, style: 'balanced', replaceExisting: true }); await refresh() } }} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><RotateCcw className="size-4" /> Volver a generar una propuesta</button>}
        </div>
      )}

      {tab === 'before-leaving' && (
        <BeforeLeaving items={items} luggage={tripLuggage} currentUserId={currentUserId} canEditTrip={canEditTrip} busyId={busyId} onPatch={patchItem} onEdit={item => { setEditingItem(item); setItemModalOpen(true) }} onRemove={removeItem} />
      )}

      {tab !== 'bags' && items.length > 0 && canEditTrip && (
        <button onClick={() => { setEditingItem(null); setItemModalOpen(true) }} className="fixed bottom-5 right-4 z-30 flex h-13 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:-translate-y-0.5 sm:bottom-7 sm:right-7"><Plus className="size-5" /> Artículo</button>
      )}

      <LuggageFormModal
        open={bagModalOpen}
        luggage={editingBag}
        preset={bagPreset}
        onClose={() => setBagModalOpen(false)}
        onSave={saveBag}
        onArchive={editingBag ? async () => { await luggageApi.archive(editingBag.id); setBagModalOpen(false); await refresh() } : undefined}
        onDelete={editingBag ? async () => { await luggageApi.remove(editingBag.id); setBagModalOpen(false); await refresh() } : undefined}
      />
      <PackingItemModal open={itemModalOpen} item={editingItem} luggage={tripLuggage} onClose={() => setItemModalOpen(false)} onSave={saveItem} />
    </section>
  )
}

function LuggageCard({ luggage, activeItems, selected, selecting, canSelect, onToggle, onEdit, onDuplicate }: { luggage: Luggage; activeItems: number; selected: boolean; selecting: boolean; canSelect: boolean; onToggle: () => void; onEdit: () => void; onDuplicate: () => void }) {
  const Icon = luggageIcon(luggage.type)
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute right-0 top-0 size-32 rounded-bl-full opacity-[0.08]" style={{ backgroundColor: luggage.color }} />
      <div className="relative flex items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: luggage.color }}><Icon className="size-7" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="truncate font-bold">{luggage.name}</h3><p className="text-xs text-muted-foreground">{LUGGAGE_TYPES[luggage.type].shortLabel}</p></div><button onClick={onEdit} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100" aria-label="Editar"><Edit3 className="size-4" /></button></div>{luggage.brand && <p className="mt-1 text-xs font-medium">{luggage.brand} {luggage.model}</p>}</div></div>
      <div className="relative mt-5 grid grid-cols-3 gap-2"><Stat value={luggage.capacityLiters ? `${luggage.capacityLiters} L` : '—'} label="Capacidad" /><Stat value={`${luggage.emptyWeight} kg`} label="Vacía" /><Stat value={luggage.maxWeight ? `${luggage.maxWeight} kg` : '—'} label="Máximo" /></div>
      <div className="relative mt-4 flex flex-wrap gap-1.5">{luggage.personalItemCompatible && <Badge>Artículo personal</Badge>}{luggage.cabinCompatible && <Badge>Cabina</Badge>}{luggage.checkedBaggage && <Badge>Bodega</Badge>}</div>
      {canSelect && <button type="button" disabled={selecting} onClick={onToggle} className={cn('relative mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition', selected ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-primary/10 text-primary hover:bg-primary/15')}>
        {selecting ? <Loader2 className="size-4 animate-spin" /> : selected ? <CheckCircle2 className="size-4" /> : <Plus className="size-4" />}
        {selected ? 'Incluida en este viaje' : 'Usar en este viaje'}
      </button>}
      <div className="relative mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{luggage.tripAssignments?.length ?? 0} viajes · {activeItems} artículos ahora</span><button onClick={onDuplicate} className="flex items-center gap-1 font-semibold hover:text-primary"><Copy className="size-3.5" /> Duplicar</button></div>
    </article>
  )
}

function PackingOverview({ dashboard }: { dashboard: PackingDashboard }) {
  const haveProgress = dashboard.totals.total ? Math.round((dashboard.totals.haveIt / dashboard.totals.total) * 100) : 0
  const packedProgress = dashboard.totals.total ? Math.round((dashboard.totals.packed / dashboard.totals.total) * 100) : 0
  return (
    <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-5 text-white shadow-xl sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Progreso general</p><h2 className="mt-1 text-2xl font-bold">Tu equipaje está {packedProgress}% listo</h2><p className="mt-1 text-sm text-slate-300">Ya tienes {dashboard.totals.haveIt} de {dashboard.totals.total} artículos y guardaste {dashboard.totals.packed}.</p></div><div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#38bdf8_var(--progress),rgba(255,255,255,0.12)_0)] p-2" style={{ '--progress': `${packedProgress}%` } as React.CSSProperties}><div className="flex size-full items-center justify-center rounded-full bg-slate-900 text-xl font-bold">{packedProgress}%</div></div></div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><ProgressStat icon={Check} value={`${haveProgress}%`} label="Lo tienes" /><ProgressStat icon={PackageCheck} value={dashboard.totals.packed} label="Guardados" /><ProgressStat icon={ShoppingCart} value={dashboard.totals.toBuy} label="Por comprar" /><ProgressStat icon={AlertTriangle} value={dashboard.totals.unassigned} label="Sin maleta" /></div>
    </div>
  )
}

function WeightCard({ entry, onWeight }: { entry: PackingDashboard['luggage'][number]; onWeight: (value: number) => Promise<void> }) {
  const Icon = luggageIcon(entry.luggage.type)
  const [actual, setActual] = useState(entry.actualWeight?.toString() ?? '')
  return <article className="min-w-[270px] flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: entry.luggage.color }}><Icon className="size-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold">{entry.luggage.name}</h3><p className="text-xs text-muted-foreground">{entry.packedCount}/{entry.itemCount} guardados</p></div><strong className="text-sm">{entry.progress}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${entry.progress}%` }} /></div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-[11px] text-muted-foreground">Peso estimado</p><p className="font-bold">{entry.estimatedWeight} kg <span className="text-xs font-normal text-muted-foreground">/ {entry.maxWeight ?? '—'}</span></p></div><label className="w-24"><span className="text-[10px] text-muted-foreground">Peso real</span><input type="number" step="0.1" value={actual} onChange={event => setActual(event.target.value)} onBlur={() => actual && onWeight(Number(actual))} className="h-8 w-full rounded-lg border border-input px-2 text-xs" /></label></div>{entry.warnings.map(warning => <p key={warning} className="mt-2 flex gap-1 text-[11px] text-amber-700"><AlertTriangle className="mt-0.5 size-3 shrink-0" />{warning}</p>)}</article>
}

function PackingCategoryGroup({ category, items, luggage, currentUserId, canEditTrip, busyId, onPatch, onEdit, onRemove }: { category: PackingItem['category']; items: PackingItem[]; luggage: TripLuggage[]; currentUserId: string; canEditTrip: boolean; busyId: string | null; onPatch: (item: PackingItem, data: Partial<PackingItem>) => void; onEdit: (item: PackingItem) => void; onRemove: (item: PackingItem) => void }) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><span className={cn('flex size-8 items-center justify-center rounded-xl', meta.color)}><Icon className="size-4" /></span><div><h3 className="text-sm font-bold">{meta.label}</h3><p className="text-[11px] text-muted-foreground">{items.filter(item => item.packed).length} de {items.length} guardados</p></div></div>{canEditTrip && <button onClick={() => items.filter(item => item.userId === currentUserId || item.shared).forEach(item => onPatch(item, { haveIt: true, packed: true }))} className="text-xs font-semibold text-primary">Marcar todo</button>}</div><div className="divide-y divide-border/70">{items.map(item => <PackingItemRow key={item.id} item={item} luggage={luggage} canEdit={canEditTrip && (item.userId === currentUserId || item.shared)} busy={busyId === item.id} onPatch={data => onPatch(item, data)} onEdit={() => onEdit(item)} onRemove={() => onRemove(item)} />)}</div></div>
}

function PackingItemRow({ item, luggage, canEdit, busy, onPatch, onEdit, onRemove }: { item: PackingItem; luggage: TripLuggage[]; canEdit: boolean; busy: boolean; onPatch: (data: Partial<PackingItem>) => void; onEdit: () => void; onRemove: () => void }) {
  const assigned = luggage.find(entry => entry.id === item.luggageId)
  return <div className={cn('group p-3.5 transition', item.packed && 'bg-emerald-50/40')}><div className="flex items-start gap-3"><div className="flex shrink-0 gap-1"><button disabled={!canEdit || busy} onClick={() => onPatch({ haveIt: !item.haveIt, ...(item.haveIt ? { packed: false } : {}) })} className={cn('flex size-10 items-center justify-center rounded-xl border-2 transition', item.haveIt ? 'border-sky-500 bg-sky-500 text-white' : 'border-border text-muted-foreground')} aria-label={item.haveIt ? 'Marcar como no disponible' : 'Marcar que lo tengo'} title="Lo tengo">{item.haveIt ? <Check className="size-5" /> : <Circle className="size-5" />}</button><button disabled={!canEdit || !item.haveIt || busy} onClick={() => onPatch({ packed: !item.packed })} className={cn('flex size-10 items-center justify-center rounded-xl border-2 transition', item.packed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border text-muted-foreground disabled:opacity-35')} aria-label={item.packed ? 'Sacar de la maleta' : 'Marcar como guardado'} title="Está guardado"><PackageCheck className="size-5" /></button></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><button disabled={!canEdit} onClick={onEdit} className={cn('text-left text-sm font-semibold', item.packed && 'text-muted-foreground line-through')}>{item.name}</button>{item.priority === 'essential' && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Esencial</span>}{item.purchaseRequired && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Comprar</span>}{item.shared && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">Compartido</span>}</div><p className="mt-0.5 text-xs text-muted-foreground">{item.quantity} ud · {item.estimatedWeight} kg · {assigned?.luggage.name ?? 'Sin asignar'}</p>{item.explanation && <p className="mt-1 line-clamp-1 text-[11px] text-primary/70">{item.explanation}</p>}</div>{canEdit && <button onClick={onEdit} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-100 hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100"><Edit3 className="size-4" /></button>}</div>{canEdit && <div className="mt-2 flex items-center gap-2 pl-[92px]"><div className="flex items-center rounded-lg border border-border"><button onClick={() => item.quantity > 1 && onPatch({ quantity: item.quantity - 1 })} className="size-7 text-sm">−</button><span className="min-w-7 text-center text-xs font-semibold">{item.quantity}</span><button onClick={() => onPatch({ quantity: item.quantity + 1 })} className="size-7 text-sm">+</button></div><select value={item.luggageId ?? ''} onChange={event => onPatch({ luggageId: event.target.value || null })} className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-xs"><option value="">Mover a…</option>{luggage.map(entry => <option key={entry.id} value={entry.id}>{entry.luggage.name}</option>)}</select><button onClick={onRemove} className="text-xs text-muted-foreground hover:text-red-600"><Archive className="size-3.5" /></button></div>}</div>
}

function BeforeLeaving({ items, ...props }: { items: PackingItem[] } & Omit<Parameters<typeof PackingCategoryGroup>[0], 'category' | 'items'>) {
  const critical = items.filter(item => ['same_day', 'before_leaving'].includes(item.packMoment) && item.status !== 'skipped')
  const pending = critical.filter(item => !item.packed)
  return <div className="mx-auto max-w-3xl space-y-5"><div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 p-6 text-white shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">Checklist final</p><h2 className="mt-1 text-2xl font-bold">Antes de salir</h2><p className="mt-2 max-w-lg text-sm text-white/85">Documentos, dispositivos y cosas que todavía estás usando.</p></div><div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">{pending.length}</div></div></div>{critical.length ? <PackingCategoryGroup category="other" items={critical} {...props} /> : <div className="rounded-2xl border border-dashed border-border py-14 text-center"><CheckCircle2 className="mx-auto size-9 text-emerald-500" /><h3 className="mt-3 font-bold">No tienes pendientes de último momento</h3><p className="mt-1 text-sm text-muted-foreground">Los artículos marcados para el día del viaje aparecerán aquí.</p></div>}{critical.length > 0 && pending.length === 0 && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"><Sparkles className="mx-auto size-6 text-emerald-600" /><h3 className="mt-2 font-bold text-emerald-900">¡Todo listo para salir!</h3><p className="text-sm text-emerald-700">Que tengas un excelente viaje.</p></div>}</div>
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-muted/50 p-2.5 text-center"><strong className="block text-sm">{value}</strong><span className="text-[10px] text-muted-foreground">{label}</span></div> }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{children}</span> }
function ProgressStat({ icon: Icon, value, label }: { icon: typeof Check; value: string | number; label: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"><Icon className="size-4 text-sky-300" /><strong className="mt-2 block text-lg">{value}</strong><span className="text-[11px] text-slate-300">{label}</span></div> }
