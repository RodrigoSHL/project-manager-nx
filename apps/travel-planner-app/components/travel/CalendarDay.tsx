'use client';

import { Activity, TravelDay, COUNTRIES } from '@/lib/types';
import { getCountryTabBackground } from '@/lib/country-colors';
import { ActivityTypeBadge } from './ActivityTypeBadge';
import { cn } from '@/lib/utils';
import { Plus, ArrowRight, Pencil, Flag } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

interface Props {
  date: string;
  activities: Activity[];
  travelDay?: TravelDay;
  isCurrentMonth?: boolean;
  onAddActivity: (date: string) => void;
  onSelectDay: (date: string) => void;
  onEditActivity: (activity: Activity) => void;
  onEditTravelDay: (date: string) => void;
  canEdit?: boolean;
}

function getCountryFlag(name: string) {
  return COUNTRIES.find((c) => c.name === name)?.flag ?? '';
}

export function CalendarDay({
  date,
  activities,
  travelDay,
  isCurrentMonth = true,
  onAddActivity,
  onSelectDay,
  onEditActivity,
  onEditTravelDay,
  canEdit = true,
}: Props) {
  const dateObj = parseISO(date);
  const dayNum = format(dateObj, 'd');
  const today = isToday(dateObj);

  // Highlight transport activities (flight/train) prominently
  const transportActivities = activities.filter(
    (a) => a.type === 'flight' || a.type === 'train'
  );
  const otherActivities = activities.filter(
    (a) => a.type !== 'flight' && a.type !== 'train'
  );
  const maxVisible = 2;
  const allVisible = [...transportActivities, ...otherActivities].slice(
    0,
    maxVisible
  );
  const overflow = activities.length - maxVisible;

  const countries = travelDay?.countries ?? [];

  return (
    <div
      className={cn(
        'group min-h-[110px] flex flex-col rounded-lg border transition-colors cursor-pointer',
        isCurrentMonth
          ? 'bg-card border-border'
          : 'bg-muted/40 border-border/50',
        today && 'ring-2 ring-primary ring-offset-1',
        activities.length > 0 && 'hover:shadow-md'
      )}
      onClick={() => onSelectDay(date)}
    >
      {/* Country strip */}
      {countries.length > 0 ? (
        <div
          className="group/strip flex items-center justify-between gap-1 px-2 py-1 text-xs font-medium text-slate-800 rounded-t-lg border-b border-black/10"
          style={{ background: getCountryTabBackground(countries) }}
        >
          {countries.length === 1 ? (
            <span className="truncate">
              {getCountryFlag(countries[0])} {countries[0]}
            </span>
          ) : (
            <span className="flex items-center gap-1 truncate">
              <span>{getCountryFlag(countries[0])}</span>
              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span>{getCountryFlag(countries[countries.length - 1])}</span>
            </span>
          )}
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTravelDay(date);
              }}
              className="opacity-0 group-hover/strip:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
              aria-label="Editar día"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ) : (
        isCurrentMonth &&
        canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTravelDay(date);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Configurar país del día"
            title="Configurar país"
          >
            <Flag className="w-3 h-3" />
          </button>
        )
      )}

      {/* Day header */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <span
          className={cn(
            'text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full',
            today
              ? 'bg-primary text-primary-foreground'
              : isCurrentMonth
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {dayNum}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddActivity(date);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
          aria-label="Agregar actividad"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity pills */}
      <div className="px-1.5 pb-1.5 flex flex-col gap-0.5 flex-1">
        {allVisible.map((activity) => (
          <button
            key={activity.id}
            onClick={(e) => {
              e.stopPropagation();
              onEditActivity(activity);
            }}
            disabled={!canEdit}
            className="w-full text-left disabled:cursor-default"
          >
            <ActivityTypeBadge
              type={activity.type}
              size="sm"
              showLabel
              className={cn(
                'w-full justify-start truncate text-[10px] py-0.5',
                activity.status === 'cancelled' && 'opacity-50 line-through'
              )}
            />
          </button>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-muted-foreground pl-1">
            +{overflow} más
          </span>
        )}
      </div>
    </div>
  );
}
