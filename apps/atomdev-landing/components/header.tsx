'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Tecnologías', href: '#tecnologias' },
  { label: 'Cómo trabajamos', href: '#proceso' },
  { label: 'Contacto', href: '#contacto' },
]

function AtomIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-22 -22 44 44"
      width={28}
      height={28}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx={0} cy={0} rx={18} ry={7} stroke="currentColor" strokeWidth={1.2} />
      <ellipse cx={0} cy={0} rx={18} ry={7} stroke="currentColor" strokeWidth={1.2} transform="rotate(60)" />
      <ellipse cx={0} cy={0} rx={18} ry={7} stroke="currentColor" strokeWidth={1.2} transform="rotate(-60)" />
      <circle cx={0} cy={0} r={3.5} fill="currentColor" />
    </svg>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleNavClick(href: string) {
    setMenuOpen(false)
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass border-b border-white/[0.06]'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#inicio"
          onClick={(e) => { e.preventDefault(); handleNavClick('#inicio') }}
          className="flex items-center gap-2 group"
          aria-label="Atom Dev – inicio"
        >
          <AtomIcon className="text-turquoise transition-transform duration-300 group-hover:rotate-45" />
          <span className="text-lg font-bold tracking-widest text-foreground group-hover:text-turquoise transition-colors duration-200">
            ATOM<span className="text-turquoise">.</span>DEV
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-turquoise focus-visible:outline-none focus-visible:text-turquoise"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA button */}
        <div className="hidden lg:flex">
          <a
            href="#contacto"
            onClick={(e) => { e.preventDefault(); handleNavClick('#contacto') }}
            className="inline-flex items-center gap-2 rounded-lg border border-turquoise/40 bg-turquoise/10 px-4 py-2 text-sm font-medium text-turquoise transition-all duration-200 hover:bg-turquoise/20 hover:border-turquoise/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50"
          >
            Hablemos de tu proyecto
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass border-b border-white/[0.06] lg:hidden"
            aria-label="Navegación móvil"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                  className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-turquoise"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={(e) => { e.preventDefault(); handleNavClick('#contacto') }}
                className="mt-2 rounded-lg border border-turquoise/40 bg-turquoise/10 px-4 py-2.5 text-center text-sm font-medium text-turquoise transition-all hover:bg-turquoise/20"
              >
                Hablemos de tu proyecto
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
