'use client'

import { motion } from 'framer-motion'
import { Search, FileText, LayoutDashboard, Code2, ShieldCheck, Zap } from 'lucide-react'
import { SectionHeading } from './section-heading'

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Descubrimiento',
    description:
      'Conocemos el problema, los objetivos, los usuarios y el contexto del proyecto.',
    color: 'turquoise' as const,
  },
  {
    number: '02',
    icon: FileText,
    title: 'Levantamiento',
    description:
      'Documentamos procesos, requerimientos, reglas de negocio y prioridades.',
    color: 'pink' as const,
  },
  {
    number: '03',
    icon: LayoutDashboard,
    title: 'Diseño y arquitectura',
    description:
      'Definimos la experiencia, los componentes, las integraciones y la arquitectura tecnológica.',
    color: 'turquoise' as const,
  },
  {
    number: '04',
    icon: Code2,
    title: 'Desarrollo iterativo',
    description:
      'Construimos en ciclos breves, mostrando avances y recogiendo retroalimentación.',
    color: 'pink' as const,
  },
  {
    number: '05',
    icon: ShieldCheck,
    title: 'Calidad y validación',
    description:
      'Validamos funcionalidad, seguridad, rendimiento y experiencia de uso.',
    color: 'turquoise' as const,
  },
  {
    number: '06',
    icon: Zap,
    title: 'Despliegue y evolución',
    description:
      'Automatizamos la entrega y acompañamos la mejora continua de la solución.',
    color: 'pink' as const,
  },
]

export function WorkProcess() {
  return (
    <section id="proceso" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Cómo trabajamos"
          title="Un proceso claro en cada etapa."
          subtitle="Combinamos metodologías ágiles con rigor técnico para construir software que funciona, escala y se mantiene."
          centered
          className="mb-16"
          accentColor="turquoise"
        />

        {/* Desktop: horizontal connected flow */}
        <div className="hidden lg:block">
          <div className="relative grid grid-cols-6 gap-4">
            {/* Connecting line */}
            <div
              className="absolute top-10 left-[8.33%] right-[8.33%] h-px"
              style={{
                background:
                  'linear-gradient(90deg, oklch(0.82 0.18 190 / 0.4), oklch(0.75 0.22 340 / 0.4), oklch(0.82 0.18 190 / 0.4))',
              }}
              aria-hidden="true"
            />

            {STEPS.map((step, i) => {
              const Icon = step.icon
              const colorVar =
                step.color === 'turquoise'
                  ? 'oklch(0.82 0.18 190)'
                  : 'oklch(0.75 0.22 340)'

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  {/* Icon circle */}
                  <div
                    className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
                    style={{
                      background: `${colorVar}12`,
                      border: `1px solid ${colorVar}40`,
                      boxShadow: `0 0 20px ${colorVar}20`,
                    }}
                  >
                    <Icon size={26} style={{ color: colorVar }} />
                    {/* Step number */}
                    <span
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{
                        background: colorVar,
                        color: 'oklch(0.09 0.015 240)',
                      }}
                    >
                      {step.number.slice(1)}
                    </span>
                  </div>

                  <div>
                    <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Mobile / tablet: vertical timeline */}
        <div className="flex flex-col gap-0 lg:hidden">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const colorVar =
              step.color === 'turquoise'
                ? 'oklch(0.82 0.18 190)'
                : 'oklch(0.75 0.22 340)'
            const isLast = i === STEPS.length - 1

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex gap-5"
              >
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `${colorVar}12`,
                      border: `1px solid ${colorVar}40`,
                      boxShadow: `0 0 12px ${colorVar}20`,
                    }}
                  >
                    <Icon size={18} style={{ color: colorVar }} />
                  </div>
                  {!isLast && (
                    <div
                      className="mt-2 w-px flex-1"
                      style={{
                        background: `linear-gradient(${colorVar}40, transparent)`,
                        minHeight: 48,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-8 ${isLast ? '' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: colorVar }}
                    >
                      {step.number}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
