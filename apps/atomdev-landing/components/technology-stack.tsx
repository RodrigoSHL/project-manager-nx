'use client'

import { motion } from 'framer-motion'
import { SectionHeading } from './section-heading'

interface TechItem {
  name: string
  abbr?: string
}

interface TechCategory {
  label: string
  color: 'turquoise' | 'pink'
  items: TechItem[]
}

const CATEGORIES: TechCategory[] = [
  {
    label: 'Backend',
    color: 'turquoise',
    items: [
      { name: '.NET 10', abbr: '.NET' },
      { name: 'C#' },
      { name: 'ASP.NET Core', abbr: 'ASP' },
      { name: 'Node.js', abbr: 'Node' },
      { name: 'NestJS', abbr: 'Nest' },
    ],
  },
  {
    label: 'Frontend',
    color: 'pink',
    items: [
      { name: 'React' },
      { name: 'Angular' },
      { name: 'Vue' },
      { name: 'TypeScript', abbr: 'TS' },
      { name: 'JavaScript', abbr: 'JS' },
      { name: 'Blazor' },
    ],
  },
  {
    label: 'Datos',
    color: 'turquoise',
    items: [
      { name: 'SQL Server', abbr: 'MSSQL' },
      { name: 'PostgreSQL', abbr: 'PG' },
      { name: 'MongoDB', abbr: 'Mongo' },
    ],
  },
  {
    label: 'DevOps',
    color: 'pink',
    items: [
      { name: 'Docker' },
      { name: 'Docker Compose', abbr: 'Compose' },
      { name: 'Kubernetes', abbr: 'K8s' },
      { name: 'Helm' },
      { name: 'GitHub Actions', abbr: 'GH Actions' },
      { name: 'Azure DevOps', abbr: 'ADO' },
    ],
  },
  {
    label: 'Cloud',
    color: 'turquoise',
    items: [
      { name: 'Microsoft Azure', abbr: 'Azure' },
      { name: 'AWS' },
      { name: 'Google Cloud', abbr: 'GCP' },
      { name: 'Oracle Cloud', abbr: 'OCI' },
    ],
  },
]

function TechNode({
  item,
  color,
  index,
}: {
  item: TechItem
  color: 'turquoise' | 'pink'
  index: number
}) {
  const colorVar =
    color === 'turquoise'
      ? 'var(--turquoise)'
      : 'var(--pink)'
  const tint = (percent: number) => `color-mix(in oklch, ${colorVar} ${percent}%, transparent)`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.06 }}
      className="group relative flex items-center justify-center rounded-xl px-4 py-3 transition-all duration-200 cursor-default"
      style={{
        background: tint(5),
        border: `1px solid ${tint(16)}`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: tint(8),
          boxShadow: `0 0 16px ${tint(16)}`,
        }}
      />
      <span
        className="relative z-10 text-sm font-medium"
        style={{ color: colorVar }}
      >
        {item.name}
      </span>
    </motion.div>
  )
}

export function TechnologyStack() {
  return (
    <section id="tecnologias" className="relative py-24 lg:py-32">
      {/* Right glow */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, var(--turquoise) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Stack tecnológico"
          title="Un ecosistema tecnológico conectado."
          subtitle="Seleccionamos las herramientas adecuadas para cada proyecto, privilegiando estabilidad, soporte y capacidad de evolución."
          centered
          className="mb-14"
          accentColor="pink"
        />

        <div className="flex flex-col gap-10">
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="h-px flex-1"
                  style={{
                    background:
                      cat.color === 'turquoise'
                        ? 'color-mix(in oklch, var(--turquoise) 20%, transparent)'
                        : 'color-mix(in oklch, var(--pink) 20%, transparent)',
                  }}
                />
                <span
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{
                    color:
                      cat.color === 'turquoise'
                        ? 'var(--turquoise)'
                        : 'var(--pink)',
                  }}
                >
                  {cat.label}
                </span>
                <span
                  className="h-px flex-1"
                  style={{
                    background:
                      cat.color === 'turquoise'
                        ? 'color-mix(in oklch, var(--turquoise) 20%, transparent)'
                        : 'color-mix(in oklch, var(--pink) 20%, transparent)',
                  }}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                {cat.items.map((item, i) => (
                  <TechNode key={item.name} item={item} color={cat.color} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
