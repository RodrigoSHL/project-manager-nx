'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      disabled={!mounted}
      className="group relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none"
      aria-label={mounted ? label : 'Cambiar tema'}
      title={mounted ? label : 'Cambiar tema'}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative size-4">
        <Sun
          className={`absolute inset-0 size-4 transition-all duration-500 ${
            mounted && isDark
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-50 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 size-4 transition-all duration-500 ${
            mounted && !isDark
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-50 opacity-0'
          }`}
        />
      </span>
      <span className="sr-only">{mounted ? label : 'Cambiar tema'}</span>
    </button>
  )
}
