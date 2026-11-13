import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Pencil } from 'lucide-react';
import {
  TRAINING_HISTORY_PAGE_SIZE,
  type CompletedTraining,
  type TrainingHistory as HistoryPage,
} from '@project-manager/macrofit-contracts';
import { trainingApi } from './training-api';
import { formatTrainingDay, formatTrainingNumber } from './training-model';
import { secondaryButton } from './training-styles';

export function TrainingHistory({
  onEdit,
}: {
  onEdit: (session: CompletedTraining) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState<HistoryPage | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    trainingApi.history(offset).then(
      (data) => {
        if (active) setPage(data);
      },
      (failure: unknown) => {
        if (active) {
          setError(
            failure instanceof Error
              ? failure.message
              : 'No se pudo cargar el historial.'
          );
        }
      }
    );
    return () => {
      active = false;
    };
  }, [offset, attempt]);

  const navigatePage = (nextOffset: number) => {
    setPage(null);
    setError('');
    setOffset(nextOffset);
  };

  return (
    <section
      aria-labelledby="training-history-heading"
      className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
    >
      <h2 id="training-history-heading" className="text-lg font-bold">
        Historial de sesiones
      </h2>
      {error ? (
        <div role="alert" className="space-y-2 text-sm text-rose-200">
          <p>{error}</p>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              setError('');
              setAttempt((previous) => previous + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : !page ? (
        <p role="status" className="text-sm text-slate-400">
          Cargando historial…
        </p>
      ) : page.sessions.length === 0 ? (
        <p className="text-sm text-slate-400">
          Las sesiones finalizadas aparecerán aquí.
        </p>
      ) : (
        <div className="space-y-3">
          {page.sessions.map((session, index) => (
            <details
              key={session.id}
              open={index === 0}
              className="group rounded-xl border border-slate-800 bg-slate-950/35"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-3 focus-visible:outline-2 focus-visible:outline-lime-300">
                <CalendarDays
                  size={18}
                  className="shrink-0 text-lime-300"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <time
                    dateTime={session.performedOn}
                    className="block text-sm font-semibold"
                  >
                    {formatTrainingDay(session.performedOn)}
                  </time>
                  <span className="block text-xs leading-relaxed text-slate-400">
                    {session.exercises
                      .map(({ exercise }) => exercise.name)
                      .join(' · ')}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-slate-400 group-open:rotate-180"
                />
              </summary>
              <div className="space-y-3 border-t border-slate-800 p-3">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => onEdit(session)}
                >
                  <Pencil size={16} aria-hidden="true" /> Editar sesión
                </button>
                {session.exercises.map(({ exercise, sets }) => (
                  <div key={exercise.id}>
                    <h3 className="text-sm font-semibold">{exercise.name}</h3>
                    <ol className="mt-1 space-y-1 text-sm tabular-nums text-slate-300">
                      {sets.map(({ id: setId, reps, weightKg }, setIndex) => (
                        <li key={setId}>
                          Serie {setIndex + 1} · {reps} rep ·{' '}
                          {formatTrainingNumber(weightKg)} kg
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {(offset > 0 || page.nextOffset !== null) && (
            <div className="flex justify-between gap-2">
              <button
                type="button"
                className={secondaryButton}
                disabled={offset === 0}
                onClick={() =>
                  navigatePage(Math.max(0, offset - TRAINING_HISTORY_PAGE_SIZE))
                }
              >
                Más recientes
              </button>
              <button
                type="button"
                className={secondaryButton}
                disabled={page.nextOffset === null}
                onClick={() => navigatePage(page.nextOffset ?? offset)}
              >
                Más antiguas
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
