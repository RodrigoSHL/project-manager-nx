'use client';

import { Activity, STATUS_COLORS, STATUS_LABELS, COUNTRIES } from '@/lib/types';
import { ActivityTypeBadge } from './ActivityTypeBadge';
import { cn } from '@/lib/utils';
import {
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Trash2,
  Pencil,
  ArrowRight,
  Flag,
} from 'lucide-react';

interface Props {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  compact?: boolean;
  canEdit?: boolean;
}

function getCountryFlag(name: string) {
  return COUNTRIES.find((c) => c.name === name)?.flag ?? '';
}

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onDuplicate,
  compact = false,
  canEdit = true,
}: Props) {
  const statusColors = STATUS_COLORS[activity.status];

  return (
    <div
      className={cn(
        'group relative bg-card rounded-xl border border-border shadow-sm',
        'hover:shadow-md transition-shadow duration-200',
        activity.status === 'cancelled' && 'opacity-60',
        compact ? 'px-3 py-2' : 'px-4 py-3'
      )}
    >
      {/* Priority accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          activity.priority === 'high' && 'bg-red-400',
          activity.priority === 'medium' && 'bg-amber-400',
          activity.priority === 'low' && 'bg-green-400'
        )}
      />

      <div className="pl-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ActivityTypeBadge
                type={activity.type}
                size="sm"
                showLabel={!compact}
              />
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  statusColors.bg,
                  statusColors.text
                )}
              >
                {STATUS_LABELS[activity.status]}
              </span>
            </div>
            <h3
              className={cn(
                'font-semibold text-foreground leading-tight',
                compact ? 'text-sm' : 'text-sm',
                activity.status === 'cancelled' && 'line-through'
              )}
            >
              {activity.title}
            </h3>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                onClick={() => onEdit(activity)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Editar actividad"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDuplicate(activity.id)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Duplicar actividad"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(activity.id)}
                className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                aria-label="Eliminar actividad"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        {!compact && (
          <div className="mt-2 flex flex-col gap-1">
            {(activity.startTime || activity.endTime) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activity.startTime}
                  {activity.endTime && ` — ${activity.endTime}`}
                </span>
              </div>
            )}

            {/* Transit countries */}
            {activity.originCountry && activity.destinationCountry && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="w-3.5 h-3.5 shrink-0" />
                <span className="flex items-center gap-1">
                  <span>
                    {getCountryFlag(activity.originCountry)}{' '}
                    {activity.originCountry}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                  <span>
                    {getCountryFlag(activity.destinationCountry)}{' '}
                    {activity.destinationCountry}
                  </span>
                </span>
              </div>
            )}

            {activity.city && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {activity.city}
                  {activity.location ? ` — ${activity.location}` : ''}
                </span>
              </div>
            )}

            {activity.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {activity.description}
              </p>
            )}

            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
              >
                <ExternalLink className="w-3 h-3" />
                Ver reserva
              </a>
            )}
          </div>
        )}

        {/* Compact: just time + city */}
        {compact && (activity.startTime || activity.city) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {activity.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.startTime}
              </span>
            )}
            {activity.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {activity.city}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
