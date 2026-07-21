import { ActivityType, ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS } from '@/lib/types'
import {
  Plane, Train, Bus, Car, BedDouble, Camera, Utensils,
  ShoppingBag, FileText, Bell, Coffee, MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  flight:        Plane,
  train:         Train,
  bus:           Bus,
  transfer:      Car,
  accommodation: BedDouble,
  sightseeing:   Camera,
  food:          Utensils,
  shopping:      ShoppingBag,
  document:      FileText,
  reminder:      Bell,
  free:          Coffee,
  other:         MoreHorizontal,
}

interface Props {
  type: ActivityType
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ActivityTypeBadge({ type, showLabel = true, size = 'md', className }: Props) {
  const colors = ACTIVITY_TYPE_COLORS[type]
  const Icon = TYPE_ICONS[type]
  const label = ACTIVITY_TYPE_LABELS[type]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        colors.bg, colors.text, colors.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}
