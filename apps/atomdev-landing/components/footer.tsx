'use client'

import { Mail } from 'lucide-react'
import { BrandLogo } from './brand-logo'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Minería / GridAssets', href: '#gridassets' },
  { label: 'Tecnologías', href: '#tecnologias' },
  { label: 'Cómo trabajamos', href: '#proceso' },
  { label: 'Contacto', href: '#contacto' },
]

const CONTACT_EMAIL = 'contacto@atomdev.cl'
// TODO: reemplazar con URL real de LinkedIn
const LINKEDIN_URL = 'https://www.linkedin.com/company/atomdev'

export function Footer() {
  const year = new Date().getFullYear()

  function handleNavClick(href: string) {
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-xs">
            <a
              href="#inicio"
              onClick={(e) => { e.preventDefault(); handleNavClick('#inicio') }}
              className="flex items-center group"
              aria-label="AtomDev – inicio"
            >
              <BrandLogo className="h-9 w-[148px]" />
            </a>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ingeniería de software para empresas, minería y operaciones en terreno.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Navegación de pie de página">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                    className="text-sm text-muted-foreground transition-colors hover:text-turquoise focus-visible:outline-none focus-visible:text-turquoise"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact & social */}
          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-turquoise focus-visible:outline-none"
            >
              <Mail size={14} />
              {/* TODO: reemplazar con correo real */}
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-turquoise focus-visible:outline-none"
              aria-label="LinkedIn de AtomDev (abre en nueva pestaña)"
            >
              {/* LinkedIn icon inline */}
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              {/* TODO: reemplazar con URL real de LinkedIn */}
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground/60">
            &copy; {year} AtomDev. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Diseñado y desarrollado con precisión atómica.
          </p>
        </div>
      </div>
    </footer>
  )
}
