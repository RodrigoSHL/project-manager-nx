'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  tags: string[]
  accentColor: 'turquoise' | 'pink'
  index: number
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  tags,
  accentColor,
  index,
}: ServiceCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const colorVar =
    accentColor === 'turquoise'
      ? 'var(--turquoise)'
      : 'var(--pink)'

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = (e.clientX - rect.left) / rect.width - 0.5
    const cy = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: cy * -6, y: cx * 6 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
    setHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered ? 'transform 0.08s linear' : 'transform 0.4s ease',
      }}
      className="group relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-300"
    >
      {/* Glass background */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          background: hovered
            ? `linear-gradient(135deg, color-mix(in oklch, ${colorVar} 5%, transparent), var(--surface-raised))`
            : 'var(--surface-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${hovered ? `color-mix(in oklch, ${colorVar} 35%, transparent)` : 'var(--border)'}`,
          boxShadow: hovered
            ? `0 4px 32px color-mix(in oklch, ${colorVar} 12%, transparent), inset 0 1px 0 color-mix(in oklch, ${colorVar} 10%, transparent)`
            : 'none',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-5">
        {/* Icon */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: `color-mix(in oklch, ${colorVar} 10%, transparent)`,
            boxShadow: hovered ? `0 0 20px color-mix(in oklch, ${colorVar} 18%, transparent)` : 'none',
          }}
        >
          <Icon size={24} style={{ color: colorVar }} />
        </div>

        {/* Text */}
        <div>
          <h3 className="mb-2 text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-200"
              style={{
                background: `color-mix(in oklch, ${colorVar} 8%, transparent)`,
                color: colorVar,
                border: `1px solid color-mix(in oklch, ${colorVar} 16%, transparent)`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
