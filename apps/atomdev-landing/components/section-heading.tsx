'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  label?: string
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
  accentColor?: 'turquoise' | 'pink'
}

export function SectionHeading({
  label,
  title,
  subtitle,
  centered = false,
  className,
  accentColor = 'turquoise',
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-4',
        centered && 'items-center text-center',
        className,
      )}
    >
      {label && (
        <span
          className={cn(
            'inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase',
            accentColor === 'turquoise'
              ? 'text-turquoise'
              : 'text-[var(--pink)]',
          )}
        >
          <span
            className={cn(
              'h-px w-8 flex-shrink-0',
              accentColor === 'turquoise'
                ? 'bg-turquoise'
                : 'bg-[var(--pink)]',
            )}
          />
          {label}
        </span>
      )}

      <h2 className="text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {subtitle && (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
