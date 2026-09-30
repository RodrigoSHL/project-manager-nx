'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  CloudOff,
  FileChartColumnIncreasing,
  Pickaxe,
} from 'lucide-react'

const CAPABILITIES = [
  {
    icon: ClipboardCheck,
    title: 'Inspecciones en terreno',
    description: 'Pautas configurables para registrar tareas, mediciones, comentarios y fotografías por activo.',
  },
  {
    icon: CloudOff,
    title: 'Preparado para trabajar offline',
    description: 'Continúa inspeccionando sin señal y sincroniza los cambios cuando vuelva la conexión.',
  },
  {
    icon: BarChart3,
    title: 'Datos para decidir',
    description: 'Hallazgos, tendencias y reportes ayudan a entender el estado de los equipos y priorizar acciones.',
  },
]

export function MiningShowcase() {
  return (
    <section id="gridassets" className="relative overflow-hidden py-24 lg:py-32">
      <div
        className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, oklch(0.82 0.18 190) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:gap-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-turquoise/30 bg-turquoise/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-turquoise uppercase">
            <Pickaxe size={14} />
            Tecnología para minería
          </span>
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">Nuestro producto</p>
            <h2 className="text-3xl font-bold leading-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
              GridAssets conecta la inspección con la{' '}
              <span className="text-turquoise text-glow-turquoise">historia de cada activo.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Una plataforma para organizar activos, ejecutar trabajos de inspección y mantener la información disponible para los equipos de terreno y quienes toman decisiones.
          </p>

          <div className="grid gap-5">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-turquoise">
                  <Icon size={19} />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href="https://inspection.atomdev.cl/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-turquoise px-6 py-3 text-sm font-semibold text-background shadow-lg transition-all duration-200 hover:bg-turquoise/90 hover:shadow-[0_0_24px_oklch(0.82_0.18_190/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50"
          >
            Conocer GridAssets
            <ArrowRight size={16} />
          </a>
          <p className="text-xs text-muted-foreground/60">Abre la plataforma Inspection en una pestaña nueva.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-turquoise/[0.06] blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[oklch(0.13_0.018_240/0.88)] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">VISTA DE ACTIVOS</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Salud operacional</h3>
              </div>
              <span className="rounded-full border border-turquoise/25 bg-turquoise/10 px-3 py-1 text-xs font-medium text-turquoise">Ejemplo visual</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-xs text-muted-foreground">Inspecciones</p>
                <p className="mt-2 text-2xl font-bold text-foreground">En terreno</p>
                <p className="mt-1 text-xs text-turquoise">Registro estructurado por activo</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-xs text-muted-foreground">Seguimiento</p>
                <p className="mt-2 text-2xl font-bold text-foreground">Tendencias</p>
                <p className="mt-1 text-xs text-muted-foreground">Mediciones e historial</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Condición de equipos</p>
                  <p className="mt-1 text-xs text-muted-foreground">Visualización ilustrativa de mediciones en el tiempo</p>
                </div>
                <BarChart3 className="shrink-0 text-turquoise" size={19} />
              </div>
              <div className="mt-5 h-40 w-full" role="img" aria-label="Gráfica ilustrativa de tendencia de mediciones">
                <svg viewBox="0 0 520 160" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                  {[20, 60, 100, 140].map((y) => <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="white" strokeOpacity="0.08" strokeDasharray="4 6" />)}
                  <path d="M0 125 C35 112 48 119 78 100 S123 97 155 106 S201 84 235 88 S281 68 312 78 S358 60 390 68 S444 44 470 53 S500 37 520 30" fill="none" stroke="oklch(0.82 0.18 190)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M0 125 C35 112 48 119 78 100 S123 97 155 106 S201 84 235 88 S281 68 312 78 S358 60 390 68 S444 44 470 53 S500 37 520 30 L520 160 L0 160 Z" fill="url(#chart-fill)" />
                  <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.82 0.18 190)" stopOpacity="0.2" /><stop offset="100%" stopColor="oklch(0.82 0.18 190)" stopOpacity="0" /></linearGradient></defs>
                </svg>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/70"><span>Registro inicial</span><span>Inspecciones sucesivas</span></div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink/10 text-pink"><FileChartColumnIncreasing size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Hallazgos y reportes</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Información lista para revisar y dar seguimiento</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
