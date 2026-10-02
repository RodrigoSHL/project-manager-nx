'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    window.localStorage.setItem('atomdev-theme', nextTheme)
    setTheme(nextTheme)
  }

  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50 ${compact ? 'h-10 w-10' : 'h-9 w-9'}`}
    >
      {theme === 'dark' ? <Sun size={compact ? 19 : 17} /> : <Moon size={compact ? 19 : 17} />}
    </button>
  )
}
