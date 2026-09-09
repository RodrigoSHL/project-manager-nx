'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, HeartHandshake } from 'lucide-react'
import { SectionHeading } from './section-heading'

const PILLARS = [
  {
    icon: Target,
    title: 'Precisión',
    description:
      'Analizamos los requerimientos y diseñamos cada componente con un propósito claro.',
    color: 'turquoise' as const,
  },
  {
    icon: TrendingUp,
    title: 'Escalabilidad',
    description:
      'Construimos soluciones preparadas para crecer junto con las necesidades del proyecto.',
    color: 'pink' as const,
  },
  {
    icon: HeartHandshake,
    title: 'Acompañamiento',
    description:
      'Participamos durante todo el ciclo de vida, desde la idea inicial hasta la puesta en producción.',
    color: 'turquoise' as const,
  },
]

export function ValueProposition() {
  return (
    <section id="propuesta" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">
          {/* Left: heading */}
          <div className="lg:w-1/2">
            <SectionHeading
              label="Propuesta de valor"
              title="Cada gran solución comienza en sus componentes más pequeños."
              subtitle="En Atom Dev transformamos necesidades complejas en soluciones digitales claras, mantenibles y preparadas para evolucionar. Combinamos análisis, arquitectura, desarrollo y automatización para construir software confiable de principio a fin."
            />
          </div>

          {/* Right: pillars */}
          <div className="flex flex-col gap-6 lg:w-1/2">
            {PILLARS.map((pillar, i) => {
              const Icon = pillar.icon
              const colorVar =
                pillar.color === 'turquoise'
                  ? 'oklch(0.82 0.18 190)'
                  : 'oklch(0.75 0.22 340)'

              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="glass glass-hover group flex items-start gap-5 rounded-xl p-6 transition-all duration-300"
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${colorVar}20`, boxShadow: `0 0 16px ${colorVar}30` }}
                  >
                    <Icon size={22} style={{ color: colorVar }} />
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-base font-semibold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
