import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  TRAINING_MUSCLES,
  trainingDateSchema,
  type CompletedTraining,
  type TrainingMuscle,
} from '@project-manager/macrofit-contracts';
import { getTodayDateString } from '../../hooks/useMacroStore';
import { MuscleMap } from './MuscleMap';
import { trainingApi } from './training-api';
import { formatTrainingDay, summarizeTraining } from './training-model';
import { fieldClass, secondaryButton } from './training-styles';

type TrainingEntries = Parameters<typeof summarizeTraining>[0];
type LiveSession = {
  id: string;
  performedOn: string;
  exercises: TrainingEntries;
};

function shiftDay(day: string, amount: number) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  if (date.getUTCFullYear() < 1) return '0001-01-01';
  if (date.getUTCFullYear() > 9999) return '9999-12-31';
  return date.toISOString().split('T')[0];
}

function weekStart(day: string) {
  const weekday = new Date(day + 'T00:00:00Z').getUTCDay();
  return shiftDay(day, -((weekday + 6) % 7));
}

function PeriodMap({
  from,
  to,
  weekly,
  live,
  latest,
  children,
}: {
  from: string;
  to: string;
  weekly: boolean;
  live: LiveSession | null;
  latest: CompletedTraining | null;
  children: ReactNode;
}) {
  const [result, setResult] = useState<{
    from: string;
    to: string;
    sessions: CompletedTraining[] | null;
  }>();
  const currentResult =
    result?.from === from && result.to === to ? result : undefined;
  const saved = currentResult?.sessions;
  const error = saved === null;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessions: CompletedTraining[] = [];
        let offset: number | null = 0;
        while (active && offset !== null) {
          const page = await trainingApi.history(offset, { from, to });
          sessions.push(...page.sessions);
          offset = page.nextOffset;
        }
        if (active) setResult({ from, to, sessions });
      } catch {
        if (active) setResult({ from, to, sessions: null });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [from, to, latest, attempt]);

  const inPeriod = ({ performedOn }: { performedOn: string }) =>
    performedOn >= from && performedOn <= to;
  const sessions = new Map(
    (saved ?? []).map((session) => [session.id, session])
  );
  if (latest && inPeriod(latest)) {
    const existing = sessions.get(latest.id);
    if (!existing || existing.revision < latest.revision)
      sessions.set(latest.id, latest);
  }
  if (live) sessions.delete(live.id);
  const entries = [...sessions.values()].flatMap(({ exercises }) => exercises);
  const includesLive = live && inPeriod(live);
  const { muscles, setCount } = summarizeTraining(
    includesLive ? [...entries, ...live.exercises] : entries
  );
  const untrained = (Object.keys(TRAINING_MUSCLES) as TrainingMuscle[]).filter(
    (muscle) => !muscles[muscle]
  );
  const muscleCount = Object.keys(TRAINING_MUSCLES).length;
  const title = weekly
    ? 'Mapa semanal'
    : latest &&
      from === latest.performedOn &&
      !includesLive &&
      sessions.size === 1
    ? 'Mapa de la última sesión'
    : 'Mapa muscular';

  return (
    <MuscleMap title={title} scores={muscles}>
      {children}
      <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-sm">
        {error ? (
          <div role="alert" className="space-y-2 text-rose-200">
            <p>No pudimos cargar todas las sesiones del período.</p>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setResult(undefined);
                setAttempt((value) => value + 1);
              }}
            >
              Reintentar mapa
            </button>
          </div>
        ) : saved === undefined ? (
          <p role="status" className="text-slate-400">
            Cargando sesiones del período…
          </p>
        ) : (
          <>
            <p className="text-slate-300">
              {setCount}{' '}
              {setCount === 1 ? 'serie registrada' : 'series registradas'} ·{' '}
              {muscleCount - untrained.length} de {muscleCount} grupos
              trabajados
            </p>
            {weekly && untrained.length > 0 && (
              <details className="rounded-lg bg-slate-950/60 px-3 py-2 text-slate-300">
                <summary className="cursor-pointer font-semibold">
                  Sin series registradas ({untrained.length})
                </summary>
                <p className="mt-2 text-xs leading-relaxed">
                  {untrained
                    .map((muscle) => TRAINING_MUSCLES[muscle])
                    .join(' · ')}
                </p>
              </details>
            )}
          </>
        )}
      </div>
    </MuscleMap>
  );
}

export function TrainingPeriodMap({
  defaultDay,
  live,
  latest,
}: {
  defaultDay: string;
  live: LiveSession | null;
  latest: CompletedTraining | null;
}) {
  const [weekly, setWeekly] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const currentWeek = weekStart(getTodayDateString());
  const from = weekly ? week ?? currentWeek : day ?? defaultDay;
  const to = weekly ? shiftDay(from, 6) : from;

  return (
    <PeriodMap from={from} to={to} weekly={weekly} live={live} latest={latest}>
      <div
        className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-950/55 p-1"
        role="group"
        aria-label="Período del mapa"
      >
        {[
          { label: 'Por día', value: false },
          { label: 'Acumulado semanal', value: true },
        ].map(({ label, value }) => (
          <button
            key={label}
            type="button"
            aria-pressed={weekly === value}
            onClick={() => setWeekly(value)}
            className="min-h-11 rounded-lg px-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-lime-300 aria-pressed:bg-lime-300/15 aria-pressed:text-lime-200"
          >
            {label}
          </button>
        ))}
      </div>
      {weekly ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className={secondaryButton}
            aria-label="Semana anterior"
            disabled={from === '0001-01-01'}
            onClick={() => setWeek(shiftDay(from, -7))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <div className="min-w-0 text-center text-xs leading-relaxed text-slate-300 sm:text-sm">
            <p>
              {formatTrainingDay(from)} – {formatTrainingDay(to)}
            </p>
            {from !== currentWeek && (
              <button
                type="button"
                className="min-h-9 font-semibold text-lime-300"
                onClick={() => setWeek(null)}
              >
                Esta semana
              </button>
            )}
          </div>
          <button
            type="button"
            className={secondaryButton}
            aria-label="Semana siguiente"
            disabled={to === '9999-12-31'}
            onClick={() => setWeek(shiftDay(from, 7))}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="mt-3 block space-y-1 text-sm font-medium">
          <span>Día del mapa</span>
          <input
            type="date"
            className={fieldClass}
            value={from}
            min="0001-01-01"
            max="9999-12-31"
            onChange={(event) => {
              if (trainingDateSchema.safeParse(event.target.value).success)
                setDay(event.target.value);
            }}
          />
        </label>
      )}
    </PeriodMap>
  );
}
