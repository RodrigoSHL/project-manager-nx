import { useId, useState } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
import type { WorkItemValue } from '../models';
import { formatWorkDate } from '../work-formatters';
import { localMeasurementDateTime } from '../measurement-date-time';

export function MeasurementDateTimeEditor({
  label,
  date,
  time,
  readonly,
  useCurrentMoment = false,
  onChange,
}: {
  label: string;
  date: string;
  time: string | null;
  readonly: boolean;
  useCurrentMoment?: boolean;
  onChange: (value: WorkItemValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const now = localMeasurementDateTime();
  const measurementDate = useCurrentMoment ? now.measuredAt : date;
  const measurementTime = useCurrentMoment ? now.measuredAtTime : time;
  const day =
    measurementDate === now.measuredAt
      ? 'Hoy'
      : formatWorkDate(measurementDate);
  const action = expanded ? 'Ocultar' : readonly ? 'Ver' : 'Editar';

  return (
    <div className="mt-2 min-w-0">
      <button
        type="button"
        aria-label={`${action} fecha y hora de ${label}`}
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-1 text-left text-xs text-slate-600 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-amber-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-amber-300"
      >
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {day} · {measurementTime || 'Sin hora'}
        </span>
        <span className="shrink-0 font-medium">
          {expanded ? 'Listo' : readonly ? 'Ver' : 'Editar'}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div
          id={id}
          className="mt-2 grid min-w-0 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 dark:bg-slate-950"
        >
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Fecha de medición
            <input
              type="date"
              disabled={readonly}
              value={measurementDate}
              onChange={(event) =>
                onChange({ measuredAt: event.target.value || measurementDate })
              }
              className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-base text-slate-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15 disabled:opacity-60 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-300/15"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Hora de medición (opcional)
            <input
              type="time"
              disabled={readonly}
              value={measurementTime ?? ''}
              onChange={(event) =>
                onChange({ measuredAtTime: event.target.value || null })
              }
              className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-base text-slate-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15 disabled:opacity-60 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-300 dark:focus:ring-amber-300/15"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
