'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
} from 'lucide-react'
import { SectionHeading } from './section-heading'

const CAPABILITIES = [
  'Aplicaciones empresariales',
  'Modernización de sistemas',
  'Integración con plataformas existentes',
  'Trazabilidad de procesos',
  'Gestión de usuarios y permisos',
  'Automatización de despliegues',
  'Arquitecturas mantenibles',
  'Documentación técnica y funcional',
]

export function PublicSector() {
  return (
    <section id="sector-publico" className="relative py-24 lg:py-32">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, oklch(0.82 0.18 190), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Outer container with border */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16"
          style={{
            background: 'oklch(0.12 0.018 240 / 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid oklch(0.82 0.18 190 / 0.2)',
            boxShadow: '0 0 60px oklch(0.82 0.18 190 / 0.06), inset 0 1px 0 oklch(0.82 0.18 190 / 0.1)',
          }}
        >
          {/* Decorative corner accent */}
          <div
            className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-bl-full opacity-10"
            style={{ background: 'oklch(0.82 0.18 190)' }}
            aria-hidden="true"
          />

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            {/* Left */}
            <div className="lg:w-1/2">
              <SectionHeading
                label="Sector público"
                title="Tecnología moderna para desafíos de alto impacto."
                subtitle="Contamos con experiencia construyendo soluciones sobre ecosistemas Microsoft, ampliamente utilizados en organizaciones y entidades públicas. Combinamos un stack sólido con prácticas modernas de arquitectura, seguridad, automatización y despliegue."
                accentColor="turquoise"
              />
            </div>

            {/* Right: capabilities grid */}
            <div className="lg:w-1/2">
              <p className="mb-6 text-xs font-semibold tracking-[0.18em] uppercase text-turquoise">
                Capacidades destacadas
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CAPABILITIES.map((cap, i) => (
                  <motion.div
                    key={cap}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.45,
                      delay: i * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-turquoise opacity-80"
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {cap}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
