'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { AtomAnimation } from './atom-animation'
import { useEffect, useState } from 'react'

// Framer Motion requires cubic bezier as a tuple
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

const CONCEPTS = [
  'Software empresarial',
  'Sector público',
  'Cloud',
  'Automatización',
  'DevOps',
]

export function Hero() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
  }

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden="true" />

      {/* Radial accent */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, oklch(0.82 0.18 190) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-0 sm:px-6 lg:px-8 lg:pt-32">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          {/* Text content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex max-w-2xl flex-col items-center gap-6 text-center lg:items-start lg:text-left"
          >
            {/* Badge */}
            <motion.span
              variants={item}
              className="inline-flex items-center rounded-full border border-turquoise/30 bg-turquoise/10 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-turquoise uppercase"
            >
              INGENIERÍA DE SOFTWARE · CLOUD · DEVOPS
            </motion.span>

            {/* Title */}
            <motion.h1
              variants={item}
              className="text-4xl font-bold leading-tight text-balance text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Desarrollo de software{' '}
              <span className="text-turquoise text-glow-turquoise">
                a escala atómica.
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p
              variants={item}
              className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Diseñamos soluciones digitales robustas, modernas y escalables,
              cuidando cada componente desde el levantamiento de requerimientos
              hasta su despliegue en producción.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={item}
              className="flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <button
                onClick={() => scrollTo('contacto')}
                className="inline-flex items-center gap-2 rounded-lg bg-turquoise px-6 py-3 text-sm font-semibold text-background shadow-lg transition-all duration-200 hover:bg-turquoise/90 hover:shadow-[0_0_24px_oklch(0.82_0.18_190/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50 active:scale-[0.97]"
              >
                Cuéntanos tu proyecto
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollTo('proceso')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.97]"
              >
                Conoce cómo trabajamos
              </button>
            </motion.div>
          </motion.div>

          {/* Atom animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }}
            className="flex-shrink-0"
          >
            <AtomAnimation isMobile={isMobile} />
          </motion.div>
        </div>

        {/* Concept strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 border-t border-white/[0.06] pt-8"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-between">
            {CONCEPTS.map((concept, i) => (
              <span
                key={concept}
                className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{
                    background: i % 2 === 0
                      ? 'oklch(0.82 0.18 190)'
                      : 'oklch(0.75 0.22 340)',
                  }}
                />
                {concept}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-10 flex justify-center pb-8"
        >
          <button
            onClick={() => scrollTo('propuesta')}
            aria-label="Desplazarse hacia abajo"
            className="flex flex-col items-center gap-1 text-muted-foreground/50 transition-colors hover:text-turquoise focus-visible:outline-none"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
