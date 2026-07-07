'use client'

import { useState, useRef, useEffect } from 'react'
import { COUNTRIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, ChevronDown, Search } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (countries: string[]) => void
  placeholder?: string
  multiple?: boolean
  className?: string
}

export function CountrySelector({ value, onChange, placeholder = 'Seleccionar país', multiple = true, className }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(name: string) {
    if (multiple) {
      if (value.includes(name)) {
        onChange(value.filter(v => v !== name))
      } else {
        onChange([...value, name])
      }
    } else {
      onChange([name])
      setOpen(false)
    }
  }

  function removeCountry(name: string) {
    onChange(value.filter(v => v !== name))
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input',
          'bg-card px-2.5 py-1.5 text-sm cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-ring/50',
          'transition-colors hover:border-ring/50',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length === 0 && (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}
        {value.map(name => {
          const country = COUNTRIES.find(c => c.name === name)
          return (
            <span
              key={name}
              className="flex items-center gap-1 bg-primary/10 text-primary rounded-md px-1.5 py-0.5 text-xs font-medium"
            >
              <span>{country?.flag}</span>
              <span>{name}</span>
              {multiple && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeCountry(name) }}
                  className="hover:text-destructive"
                  aria-label={`Quitar ${name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )
        })}
        <ChevronDown className={cn('ml-auto w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 rounded-md border border-input px-2 py-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto py-1">
            {filtered.map(country => (
              <li
                key={country.code}
                role="option"
                aria-selected={value.includes(country.name)}
                onClick={() => toggle(country.name)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                  'hover:bg-muted',
                  value.includes(country.name) && 'bg-primary/10 text-primary font-medium',
                )}
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
                {value.includes(country.name) && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
