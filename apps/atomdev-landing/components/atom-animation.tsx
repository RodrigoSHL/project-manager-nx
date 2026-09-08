'use client'

import { motion, useReducedMotion } from 'framer-motion'

const TECH_NODES = ['.NET', 'React', 'Azure', 'Docker', 'Node', 'K8s', 'SQL', 'CI/CD']

interface OrbitConfig {
  rx: number
  ry: number
  tilt: number       // degrees
  duration: number
  color: 'turquoise' | 'pink'
  nodeIndex: number
}

const ORBITS: OrbitConfig[] = [
  { rx: 130, ry: 44, tilt: -20, duration: 8, color: 'turquoise', nodeIndex: 0 },
  { rx: 120, ry: 50, tilt: 60, duration: 11, color: 'pink', nodeIndex: 1 },
  { rx: 145, ry: 38, tilt: 120, duration: 14, color: 'turquoise', nodeIndex: 2 },
  { rx: 110, ry: 55, tilt: 170, duration: 9, color: 'pink', nodeIndex: 3 },
]

const OUTER_ORBITS: OrbitConfig[] = [
  { rx: 195, ry: 60, tilt: 30, duration: 18, color: 'turquoise', nodeIndex: 4 },
  { rx: 185, ry: 68, tilt: 100, duration: 22, color: 'pink', nodeIndex: 5 },
  { rx: 200, ry: 55, tilt: -60, duration: 20, color: 'turquoise', nodeIndex: 6 },
  { rx: 190, ry: 65, tilt: 155, duration: 24, color: 'pink', nodeIndex: 7 },
]

function OrbitPath({ rx, ry, tilt, color }: Omit<OrbitConfig, 'duration' | 'nodeIndex'>) {
  const stroke = color === 'turquoise'
    ? 'rgba(34,211,238,0.25)'
    : 'rgba(244,114,182,0.25)'

  return (
    <ellipse
      cx={0}
      cy={0}
      rx={rx}
      ry={ry}
      fill="none"
      stroke={stroke}
      strokeWidth={1}
      transform={`rotate(${tilt})`}
    />
  )
}

function OrbitingNode({
  rx, tilt, duration, color, nodeIndex, isMobile,
}: OrbitConfig & { isMobile: boolean }) {
  const turq = '#22d3ee'
  const pink = '#f472b6'
  const nodeColor = color === 'turquoise' ? turq : pink

  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: '0px 0px' }}
    >
      <g transform={`rotate(${tilt})`}>
        {/* The orbiting dot */}
        <circle cx={rx} cy={0} r={4} fill={nodeColor} opacity={0.9}>
          <animate
            attributeName="r"
            values="3;5;3"
            dur={`${duration * 0.4}s`}
            repeatCount="indefinite"
          />
        </circle>
        {/* Glow */}
        <circle cx={rx} cy={0} r={8} fill={nodeColor} opacity={0.15} />
        {/* Tech label – hidden on mobile */}
        {!isMobile && (
          <text
            x={rx + 10}
            y={4}
            fill={nodeColor}
            fontSize="9"
            fontFamily="var(--font-sans)"
            fontWeight="600"
            opacity={0.8}
          >
            {TECH_NODES[nodeIndex]}
          </text>
        )}
      </g>
    </motion.g>
  )
}

export function AtomAnimation({ isMobile = false }: { isMobile?: boolean }) {
  const prefersReduced = useReducedMotion()
  const orbits = isMobile ? ORBITS : [...ORBITS, ...OUTER_ORBITS]

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: isMobile ? 280 : 500,
        height: isMobile ? 280 : 500,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="-220 -220 440 440"
        width={isMobile ? 280 : 500}
        height={isMobile ? 280 : 500}
        overflow="visible"
      >
        {/* Static orbit paths */}
        {orbits.map((o, i) => (
          <OrbitPath key={i} rx={o.rx} ry={o.ry} tilt={o.tilt} color={o.color} />
        ))}

        {/* Nucleus glow layers */}
        <circle cx={0} cy={0} r={40} fill="rgba(34,211,238,0.04)" />
        <circle cx={0} cy={0} r={28} fill="rgba(34,211,238,0.08)" />
        <circle cx={0} cy={0} r={18} fill="rgba(34,211,238,0.18)" />
        <circle cx={0} cy={0} r={10} fill="rgba(34,211,238,0.9)">
          <animate
            attributeName="r"
            values="9;12;9"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Pulsing ring */}
        <circle
          cx={0}
          cy={0}
          r={50}
          fill="none"
          stroke="rgba(34,211,238,0.2)"
          strokeWidth={1}
        >
          <animate
            attributeName="r"
            values="44;58;44"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0;0.3"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Orbiting nodes */}
        {!prefersReduced &&
          orbits.map((o, i) => (
            <OrbitingNode key={i} {...o} isMobile={isMobile} />
          ))}
      </svg>

      {/* Central "A" logo overlay */}
      <div
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ width: 32, height: 32 }}
      >
        <span
          className="text-sm font-bold text-turquoise text-glow-turquoise select-none"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          A
        </span>
      </div>
    </div>
  )
}
