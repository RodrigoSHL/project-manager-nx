'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'

const CONTACT_EMAIL = 'contacto@atomdev.cl'

export function CTA() {
  function scrollToContact() {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="cta" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Central luminous sphere */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="h-[500px] w-[500px] rounded-full opacity-12"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklch, var(--turquoise) 38%, transparent) 0%, color-mix(in oklch, var(--pink) 20%, transparent) 50%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Animated rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        {[200, 300, 400].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              border: '1px solid color-mix(in oklch, var(--turquoise) 10%, transparent)',
            }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-8"
        >
          {/* Small label */}
          <span className="inline-flex items-center rounded-full border border-turquoise/30 bg-turquoise/10 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-turquoise uppercase">
            ¿Listo para comenzar?
          </span>

          <h2 className="text-4xl font-bold leading-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Transformemos tu idea en una{' '}
            <span className="text-turquoise text-glow-turquoise">
              solución real.
            </span>
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Cuéntanos qué necesitas construir, mejorar o automatizar. Analizaremos
            tu proyecto para definir la mejor forma de llevarlo a producción.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 rounded-lg bg-turquoise px-7 py-3.5 text-sm font-semibold text-background shadow-lg transition-all duration-200 hover:bg-turquoise/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50 active:scale-[0.97]"
            >
              Hablemos de tu proyecto
              <ArrowRight size={16} />
            </button>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-7 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail size={16} />
              Enviar un correo
            </a>
          </div>

          {/* Email hint */}
          <p className="text-xs text-muted-foreground/60">
            {/* TODO: reemplazar con correo real */}
            {CONTACT_EMAIL}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
