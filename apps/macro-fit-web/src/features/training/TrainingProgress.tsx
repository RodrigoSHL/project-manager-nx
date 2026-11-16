import { useEffect, useState, type ComponentProps } from 'react';
import { ArrowRight, Dumbbell } from 'lucide-react';
import {
  TRAINING_MUSCLES,
  type CompletedTraining,
  type TrainingMuscle,
} from '@project-manager/macrofit-contracts';
import { getTodayDateString } from '../../hooks/useMacroStore';
import { MuscleMap } from './MuscleMap';
import { trainingApi } from './training-api';
import {
  daysBetweenTrainingDates,
  formatEquivalentSets,
  formatMuscleRecency,
  formatTrainingDay,
  muscleRecency,
  summarizeTrainingProgress,
  trainingMuscleIds,
  type TrainingProgressSession,
} from './training-model';
import { primaryButton, secondaryButton } from './training-styles';

const views = [
  { id: 'recency', label: 'Último registro' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: '30 días' },
  { id: 'total', label: 'Todo' },
] as const;

type HistoryResult =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; sessions: CompletedTraining[] };

export function TrainingProgress({
  live,
  onOpenSession,
  selectedActions,
}: {
  live: TrainingProgressSession | null;
  onOpenSession: () => void;
  selectedActions?: ComponentProps<typeof MuscleMap>['selectedActions'];
}) {
  const [view, setView] = useState<(typeof views)[number]['id']>('recency');
  const [today, setToday] = useState(getTodayDateString);
  const [result, setResult] = useState<HistoryResult>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setToday(getTodayDateString()),
      60_000
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessions: CompletedTraining[] = [];
        let offset: number | null = 0;
        while (active && offset !== null) {
          const page = await trainingApi.history(offset);
          sessions.push(...page.sessions);
          offset = page.nextOffset;
        }
        if (active) setResult({ status: 'ready', sessions });
      } catch {
        if (active) setResult({ status: 'error' });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);

  if (result.status !== 'ready') {
    return (
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-[#101624] p-4">
        <h2 className="text-lg font-bold">Mapa muscular general</h2>
        {result.status === 'loading' ? (
          <p role="status" className="text-sm text-slate-400">
            Cargando historial de entrenamiento…
          </p>
        ) : (
          <div role="alert" className="space-y-2 text-sm text-rose-200">
            <p>No pudimos cargar el historial completo.</p>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setResult({ status: 'loading' });
                setAttempt((value) => value + 1);
              }}
            >
              Reintentar mapa
            </button>
          </div>
        )}
        <button
          type="button"
          className={secondaryButton}
          onClick={onOpenSession}
        >
          Ir a sesión <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    );
  }

  // A session can appear in the history request just as its draft is finalized.
  const sessions = new Map<string, TrainingProgressSession>(
    result.sessions.map((session) => [session.id, session])
  );
  if (live && !sessions.has(live.id)) sessions.set(live.id, live);
  const { muscles, sessionsByPeriod } = summarizeTrainingProgress(
    sessions.values(),
    today
  );
  const daysAgo = {} as Record<TrainingMuscle, number | null>;
  const scores: Partial<Record<TrainingMuscle, number>> = {};
  const period = view === 'recency' ? 'month' : view;
  for (const muscle of trainingMuscleIds) {
    const { latestDay } = muscles[muscle];
    daysAgo[muscle] = latestDay
      ? daysBetweenTrainingDates(latestDay, today)
      : null;
    scores[muscle] = muscles[muscle][period];
  }

  const activeCount = trainingMuscleIds.filter(
    (muscle) => scores[muscle]
  ).length;
  const recentCount = trainingMuscleIds.filter(
    (muscle) => muscleRecency(daysAgo[muscle]) === 'recent'
  ).length;
  const gaps = trainingMuscleIds
    .flatMap((muscle) => {
      const days = daysAgo[muscle];
      const status = muscleRecency(days);
      return days !== null && (status === 'week' || status === 'month')
        ? [{ muscle, days, status }]
        : [];
    })
    .sort((a, b) => b.days - a.days);
  const unlogged = trainingMuscleIds.filter(
    (muscle) => daysAgo[muscle] === null
  );

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <MuscleMap
        selectedActions={selectedActions}
        title="Mapa muscular general"
        scores={scores}
        progress={{
          daysAgo,
          colorByRecency: view === 'recency',
          details: (muscle) => (
            <>
              <p>
                {TRAINING_MUSCLES[muscle]} ·{' '}
                {formatMuscleRecency(daysAgo[muscle]).toLowerCase()}
              </p>
              {muscles[muscle].latestDay && (
                <time
                  className="block text-xs font-normal text-slate-400"
                  dateTime={muscles[muscle].latestDay}
                >
                  {formatTrainingDay(muscles[muscle].latestDay)}
                </time>
              )}
              <p className="text-sm font-normal text-slate-300">
                7 días: {formatEquivalentSets(muscles[muscle].week)} · 30 días:{' '}
                {formatEquivalentSets(muscles[muscle].month)} · Total:{' '}
                {formatEquivalentSets(muscles[muscle].total)}
              </p>
            </>
          ),
        }}
      >
        <div
          role="group"
          aria-label="Vista del mapa general"
          className="mt-3 grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-1 rounded-xl border border-slate-800 bg-slate-950/55 p-1"
        >
          {views.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className="min-h-11 rounded-lg px-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-lime-300 aria-pressed:bg-lime-300/15 aria-pressed:text-lime-200 sm:text-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </MuscleMap>

      <section
        aria-labelledby="training-consistency-heading"
        className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
      >
        <h2 id="training-consistency-heading" className="text-lg font-bold">
          Constancia
        </h2>
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-950/55 p-3">
            <dt className="text-xs text-slate-400">
              {view === 'recency'
                ? 'Grupos en los últimos 7 días'
                : 'Grupos trabajados en el período'}
            </dt>
            <dd className="mt-1 text-lg font-bold text-lime-200">
              {view === 'recency' ? recentCount : activeCount} de{' '}
              {trainingMuscleIds.length}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-950/55 p-3">
            <dt className="text-xs text-slate-400">
              {view === 'recency'
                ? 'Sesiones de fuerza en 30 días'
                : 'Sesiones de fuerza en el período'}
            </dt>
            <dd className="mt-1 text-lg font-bold">
              {sessionsByPeriod[period]}
            </dd>
          </div>
        </dl>
        {gaps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">
              Grupos con 7 días o más sin registro
            </h3>
            <ul className="mt-2 divide-y divide-slate-800 text-sm">
              {gaps.map(({ muscle, days, status }) => (
                <li key={muscle} className="flex justify-between gap-2 py-2">
                  <span>{TRAINING_MUSCLES[muscle]}</span>
                  <span
                    className={`shrink-0 ${
                      status === 'month' ? 'text-rose-300' : 'text-amber-300'
                    }`}
                  >
                    {days} días
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {unlogged.length > 0 && (
          <details className="rounded-lg bg-slate-950/55 px-3 py-2 text-sm text-slate-300">
            <summary className="cursor-pointer font-semibold">
              Grupos sin registros ({unlogged.length})
            </summary>
            <p className="mt-2 text-xs leading-relaxed">
              {unlogged.map((muscle) => TRAINING_MUSCLES[muscle]).join(' · ')}
            </p>
          </details>
        )}
        <p className="text-xs leading-relaxed text-slate-400">
          El mapa muestra constancia según tus series de fuerza, incluidas las
          de tu sesión activa. La masa muscular requiere una medición aparte.
        </p>
        <button
          type="button"
          className={`${primaryButton} w-full`}
          onClick={onOpenSession}
        >
          <Dumbbell size={17} aria-hidden="true" /> Ir a sesión
        </button>
      </section>
    </div>
  );
}
