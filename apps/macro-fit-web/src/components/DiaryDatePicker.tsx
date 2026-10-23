import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateString } from '../hooks/useMacroStore';

export function DiaryDatePicker({
  date,
  onChange,
  disabled,
}: {
  date: string;
  onChange: (date: string) => void;
  disabled: boolean;
}) {
  const today = getTodayDateString();
  function shift(days: number) {
    const next = new Date(date + 'T12:00:00');
    next.setDate(next.getDate() + days);
    onChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(next.getDate()).padStart(2, '0')}`
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={disabled}
          aria-label="Día anterior"
          title="Día anterior"
          className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <label className="flex items-center gap-2 px-1 text-sm font-medium text-slate-200">
          <CalendarDays
            className="size-4 text-emerald-400"
            aria-hidden="true"
          />
          <input
            type="date"
            aria-label="Fecha del diario"
            value={date}
            disabled={disabled}
            onChange={(event) => {
              if (event.target.value) onChange(event.target.value);
            }}
            className="max-w-36 border-0 bg-transparent text-sm focus-visible:outline-emerald-400"
          />
        </label>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={disabled}
          aria-label="Día siguiente"
          title="Día siguiente"
          className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      {date !== today && (
        <button
          type="button"
          onClick={() => onChange(today)}
          disabled={disabled}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
