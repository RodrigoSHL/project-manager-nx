'use client'

import { useState, useEffect } from 'react'
import { TravelDay } from '@/lib/types'
import { CountrySelector } from './CountrySelector'
import { X, Save } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (day: TravelDay) => void
  date: string
  travelDay?: TravelDay
}

export function TravelDayModal({ open, onClose, onSave, date, travelDay }: Props) {
  const [countries, setCountries] = useState<string[]>([])
  const [mainCity, setMainCity] = useState('')

  useEffect(() => {
    setCountries(travelDay?.countries ?? [])
    setMainCity(travelDay?.mainCity ?? '')
  }, [travelDay, open])

  if (!open) return null

  const label = date
    ? format(parseISO(date), "EEEE d 'de' MMMM yyyy", { locale: es })
    : ''

  function handleSave() {
    onSave({ date, countries, mainCity: mainCity.trim() || undefined })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurar día"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Configurar día</h2>
            <p className="text-xs text-muted-foreground capitalize">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">País(es)</label>
            <CountrySelector
              value={countries}
              onChange={setCountries}
              placeholder="Seleccionar país(es)"
              multiple
            />
            <p className="text-xs text-muted-foreground">
              Si el día es de tránsito, selecciona origen y destino.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Ciudad principal</label>
            <input
              type="text"
              value={mainCity}
              onChange={e => setMainCity(e.target.value)}
              placeholder="ej. Madrid, París..."
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
