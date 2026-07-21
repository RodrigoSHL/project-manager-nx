'use client'

import { Filters, ActivityType, ActivityStatus, ActivityPriority, ACTIVITY_TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS, COUNTRIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function FiltersBar({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasActiveFilters =
    filters.country !== '' ||
    filters.type !== '' ||
    filters.status !== '' ||
    filters.priority !== ''

  function clearAll() {
    onChange({ country: '', type: '', status: '', priority: '' })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded(e => !e)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
            expanded
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-ring/50',
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
              {[filters.country, filters.type, filters.status, filters.priority].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {filters.country && (
          <FilterChip label={COUNTRIES.find(c => c.name === filters.country)?.flag + ' ' + filters.country} onRemove={() => onChange({ ...filters, country: '' })} />
        )}
        {filters.type && (
          <FilterChip label={ACTIVITY_TYPE_LABELS[filters.type as ActivityType]} onRemove={() => onChange({ ...filters, type: '' })} />
        )}
        {filters.status && (
          <FilterChip label={STATUS_LABELS[filters.status as ActivityStatus]} onRemove={() => onChange({ ...filters, status: '' })} />
        )}
        {filters.priority && (
          <FilterChip label={`Prioridad: ${PRIORITY_LABELS[filters.priority as ActivityPriority]}`} onRemove={() => onChange({ ...filters, priority: '' })} />
        )}
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors underline">
            Limpiar todo
          </button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card rounded-xl border border-border p-4">
          {/* Country */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">País</label>
            <select
              value={filters.country}
              onChange={e => onChange({ ...filters, country: e.target.value })}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Todos</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              value={filters.type}
              onChange={e => onChange({ ...filters, type: e.target.value as ActivityType | '' })}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Todos</option>
              {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={filters.status}
              onChange={e => onChange({ ...filters, status: e.target.value as ActivityStatus | '' })}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Todos</option>
              {(Object.entries(STATUS_LABELS) as [ActivityStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
            <select
              value={filters.priority}
              onChange={e => onChange({ ...filters, priority: e.target.value as ActivityPriority | '' })}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Todas</option>
              {(Object.entries(PRIORITY_LABELS) as [ActivityPriority, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-destructive ml-0.5" aria-label="Quitar filtro">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
