'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CursorGlow() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 28, stiffness: 180 }
  const x = useSpring(cursorX, springConfig)
  const y = useSpring(cursorY, springConfig)

  const hasPointer = useRef(false)

  useEffect(() => {
    // Only on devices that actually have a pointer
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(pointer: fine)')
    if (!mq.matches) return
    hasPointer.current = true

    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [cursorX, cursorY])

  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(pointer: fine)')
    if (!mq.matches) return null
  }

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] mix-blend-screen"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        width: 280,
        height: 280,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, oklch(0.82 0.18 190 / 0.08) 0%, transparent 70%)',
      }}
      aria-hidden="true"
    />
  )
}
