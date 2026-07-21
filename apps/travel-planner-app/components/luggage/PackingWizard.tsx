'use client'

import { useState } from 'react'
import { Backpack, Check, ChevronLeft, ChevronRight, CloudRain, Loader2, Sparkles, WashingMachine } from 'lucide-react'
import { GeneratePackingInput, Luggage, TripLuggage } from '@/services/luggageService'
import { LUGGAGE_TYPES, luggageIcon } from './luggage-ui'

interface Props {
  tripDays: number
  luggage: Luggage[]
  selected: TripLuggage[]
  onToggleLuggage: (luggage: Luggage) => Promise<void>
  onCreateLuggage: () => void
  onGenerate: (input: GeneratePackingInput) => Promise<void>
}

const CLIMATES: Array<{ value: GeneratePackingInput['climate']; label: string; emoji: string }> = [
  { value: 'hot', label: 'Caluroso', emoji: '☀️' },
  { value: 'mild', label: 'Templado', emoji: '🌤️' },
  { value: 'cold', label: 'Frío', emoji: '🧥' },
  { value: 'rainy', label: 'Lluvioso', emoji: '🌧️' },
  { value: 'snow', label: 'Nieve', emoji: '❄️' },
  { value: 'mixed', label: 'Mixto', emoji: '🌦️' },
]

const ACTIVITIES: Array<{ value: GeneratePackingInput['activities'][number]; label: string; emoji: string }> = [
  { value: 'city', label: 'Turismo urbano', emoji: '🏙️' },
  { value: 'beach', label: 'Playa', emoji: '🏖️' },
  { value: 'hiking', label: 'Senderismo', emoji: '🥾' },
  { value: 'running', label: 'Running', emoji: '🏃' },
  { value: 'formal', label: 'Evento formal', emoji: '👔' },
  { value: 'work', label: 'Trabajo', emoji: '💼' },
  { value: 'photography', label: 'Fotografía', emoji: '📷' },
  { value: 'nightlife', label: 'Vida nocturna', emoji: '🌙' },
]

export function PackingWizard({ tripDays, luggage, selected, onToggleLuggage, onCreateLuggage, onGenerate }: Props) {
  const [step, setStep] = useState(1)
  const [days, setDays] = useState(tripDays)
  const [climate, setClimate] = useState<GeneratePackingInput['climate']>('mixed')
  const [activities, setActivities] = useState<GeneratePackingInput['activities']>(['city'])
  const [laundryAccess, setLaundryAccess] = useState(tripDays > 10)
  const [laundryEveryDays, setLaundryEveryDays] = useState(7)
  const [style, setStyle] = useState<GeneratePackingInput['style']>('balanced')
  const [needsMedication, setNeedsMedication] = useState(false)
  const [carriesLaptop, setCarriesLaptop] = useState(false)
  const [reserveShoppingSpace, setReserveShoppingSpace] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleActivity(value: GeneratePackingInput['activities'][number]) {
    setActivities(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      await onGenerate({ customDays: days, climate, activities, laundryAccess, laundryEveryDays: laundryAccess ? laundryEveryDays : undefined, style, needsMedication, carriesLaptop, reserveShoppingSpace })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos generar la lista.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-xl shadow-slate-900/5">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-5 py-6 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><Sparkles className="size-5" /></div>
          <div>
            <p className="text-xs font-semibold text-blue-100">Paso {step} de 4</p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Preparar mi equipaje</h2>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map(value => <div key={value} className={`h-1.5 rounded-full ${value <= step ? 'bg-white' : 'bg-white/20'}`} />)}
        </div>
      </div>

      <div className="min-h-[390px] p-5 sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div><h3 className="text-lg font-bold">¿Cuánto dura y qué clima esperas?</h3><p className="mt-1 text-sm text-muted-foreground">Usamos las fechas del viaje como punto de partida.</p></div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Duración</span><div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-3"><button type="button" onClick={() => setDays(Math.max(1, days - 1))} className="size-10 rounded-xl bg-card text-xl shadow-sm">−</button><div className="flex-1 text-center"><strong className="text-2xl">{days}</strong><span className="ml-1 text-sm text-muted-foreground">días</span></div><button type="button" onClick={() => setDays(days + 1)} className="size-10 rounded-xl bg-card text-xl shadow-sm">+</button></div></label>
            <div><span className="mb-2 block text-sm font-semibold">Clima predominante</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{CLIMATES.map(option => <button key={option.value} type="button" onClick={() => setClimate(option.value)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${climate === option.value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border hover:bg-muted'}`}><span className="text-xl">{option.emoji}</span>{option.label}{climate === option.value && <Check className="ml-auto size-4 text-primary" />}</button>)}</div></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div><h3 className="text-lg font-bold">¿Qué harás durante el viaje?</h3><p className="mt-1 text-sm text-muted-foreground">Selecciona todo lo que aplique; podrás editar el resultado.</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ACTIVITIES.map(option => <button key={option.value} type="button" onClick={() => toggleActivity(option.value)} className={`relative rounded-2xl border p-3 text-left transition ${activities.includes(option.value) ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border hover:bg-muted'}`}><span className="block text-2xl">{option.emoji}</span><span className="mt-2 block text-xs font-semibold">{option.label}</span>{activities.includes(option.value) && <Check className="absolute right-2 top-2 size-4 text-primary" />}</button>)}</div>
            <div className="grid gap-2 sm:grid-cols-3">{[
              [needsMedication, setNeedsMedication, '💊', 'Llevo medicamentos'],
              [carriesLaptop, setCarriesLaptop, '💻', 'Llevo computador'],
              [reserveShoppingSpace, setReserveShoppingSpace, '🛍️', 'Reservar para compras'],
            ].map(([checked, setter, emoji, label]) => <label key={String(label)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium"><input type="checkbox" checked={checked as boolean} onChange={event => (setter as (value: boolean) => void)(event.target.checked)} className="size-4 accent-primary" /><span>{emoji as string}</span>{label as string}</label>)}</div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div><h3 className="text-lg font-bold">Lavado y estilo de viaje</h3><p className="mt-1 text-sm text-muted-foreground">Esto evita recomendar ropa para cada día de un viaje largo.</p></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4"><div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><WashingMachine className="size-5" /></div><div className="flex-1"><span className="block text-sm font-semibold">Tendré acceso a lavadora</span><span className="text-xs text-muted-foreground">Calcularemos ropa por ciclo de lavado.</span></div><input type="checkbox" checked={laundryAccess} onChange={event => setLaundryAccess(event.target.checked)} className="size-5 accent-primary" /></label>
            {laundryAccess && <label className="block"><span className="mb-2 block text-sm font-semibold">Podré lavar cada {laundryEveryDays} días</span><input type="range" min="3" max="14" value={laundryEveryDays} onChange={event => setLaundryEveryDays(Number(event.target.value))} className="w-full accent-primary" /></label>}
            <div><span className="mb-2 block text-sm font-semibold">Estilo</span><div className="grid gap-2 sm:grid-cols-3">{[
              ['minimal', '🎒', 'Minimalista', 'Sólo lo esencial'],
              ['balanced', '⚖️', 'Equilibrado', 'Comodidad sin exceso'],
              ['prepared', '🧳', 'Preparado', 'Más alternativas'],
            ].map(([value, emoji, label, description]) => <button key={value} type="button" onClick={() => setStyle(value as GeneratePackingInput['style'])} className={`rounded-2xl border p-4 text-left ${style === value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border'}`}><span className="text-2xl">{emoji}</span><strong className="mt-2 block text-sm">{label}</strong><span className="text-xs text-muted-foreground">{description}</span></button>)}</div></div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div><h3 className="text-lg font-bold">¿Qué equipaje llevarás?</h3><p className="mt-1 text-sm text-muted-foreground">Los artículos se distribuirán automáticamente entre estas piezas.</p></div>
            {luggage.length === 0 ? (
              <button type="button" onClick={onCreateLuggage} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-border p-8 text-center hover:border-primary"><Backpack className="mb-3 size-8 text-primary" /><strong>Agrega tu primera maleta</strong><span className="mt-1 text-sm text-muted-foreground">Puedes usar uno de nuestros tipos rápidos.</span></button>
            ) : (
              <div className="space-y-2">{luggage.map(bag => { const selectedAssignment = selected.find(entry => entry.luggageId === bag.id); const Icon = luggageIcon(bag.type); return <button key={bag.id} type="button" onClick={() => onToggleLuggage(bag)} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${selectedAssignment ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border hover:bg-muted'}`}><div className="flex size-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: bag.color }}><Icon className="size-5" /></div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{bag.name}</strong><span className="text-xs text-muted-foreground">{LUGGAGE_TYPES[bag.type].shortLabel} · {bag.capacityLiters ?? '—'} L</span></div><span className={`flex size-6 items-center justify-center rounded-full border ${selectedAssignment ? 'border-primary bg-primary text-white' : 'border-border'}`}>{selectedAssignment && <Check className="size-4" />}</span></button> })}</div>
            )}
            <button type="button" onClick={onCreateLuggage} className="text-sm font-semibold text-primary hover:underline">+ Agregar otra maleta</button>
            <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900"><div className="flex gap-2"><CloudRain className="mt-0.5 size-4 shrink-0" /><p>Generaremos una propuesta editable para <strong>{days} días</strong>, con estilo <strong>{style === 'minimal' ? 'minimalista' : style === 'balanced' ? 'equilibrado' : 'preparado'}</strong>{laundryAccess ? ` y lavado cada ${laundryEveryDays} días` : ''}.</p></div></div>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4 sm:px-8">
        <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || generating} className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /> Atrás</button>
        {step < 4 ? (
          <button type="button" onClick={() => setStep(step + 1)} className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">Continuar <ChevronRight className="size-4" /></button>
        ) : (
          <button type="button" onClick={generate} disabled={selected.length === 0 || generating} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50">{generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{generating ? 'Generando…' : 'Crear mi lista'}</button>
        )}
      </div>
    </div>
  )
}
