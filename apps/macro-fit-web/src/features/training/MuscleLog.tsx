import { useEffect, useRef, useState } from 'react';
import { BookOpen, Dumbbell, History, ListChecks } from 'lucide-react';
import {
  MAX_TRAINING_EXERCISES,
  TRAINING_CATALOG,
  trainingDateSchema,
  type CompletedTraining,
  type TrainingDraft,
  type TrainingExercise,
  type TrainingSet,
  type TrainingWorkspace,
} from '@project-manager/macrofit-contracts';
import { TrainingCatalog } from './TrainingCatalog';
import { TrainingHistory } from './TrainingHistory';
import { TrainingRoutines } from './TrainingRoutines';
import { TrainingSession } from './TrainingSession';
import { trainingApi } from './training-api';
import { summarizeTraining } from './training-model';
import { secondaryButton } from './training-styles';
import { getTodayDateString } from '../../hooks/useMacroStore';

const tabs = [
  { id: 'session', label: 'Sesión', icon: Dumbbell },
  { id: 'catalog', label: 'Catálogo', icon: BookOpen },
  { id: 'routines', label: 'Rutinas', icon: ListChecks },
  { id: 'history', label: 'Historial', icon: History },
] as const;

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo actualizar el entrenamiento.';
}

export default function MuscleLog() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('session');
  const [workspace, setWorkspace] = useState<TrainingWorkspace | null>(null);
  const [editing, setEditing] = useState<CompletedTraining | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const mutating = useRef(false);
  useEffect(() => {
    let active = true;
    trainingApi.workspace().then(
      (data) => {
        if (active) setWorkspace(data);
      },
      (failure: unknown) => {
        if (active) setError(errorMessage(failure));
      }
    );
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  async function mutate(
    action: (current: TrainingWorkspace) => Promise<TrainingWorkspace>,
    optimisticDraft?: TrainingDraft
  ) {
    if (!workspace || mutating.current) return false;
    mutating.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    if (optimisticDraft) setWorkspace({ ...workspace, draft: optimisticDraft });
    try {
      setWorkspace(await action(workspace));
      return true;
    } catch (failure: unknown) {
      setWorkspace(workspace);
      setError(errorMessage(failure));
      return false;
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  }

  const saveDraft = (draft: TrainingDraft) =>
    mutate(
      async (current) => ({
        ...current,
        ...(await trainingApi.saveDraft({ revision: current.revision, draft })),
      }),
      draft
    );

  const draft = workspace?.draft;
  const catalog = [...TRAINING_CATALOG, ...(workspace?.customExercises ?? [])];
  const catalogById = new Map(
    catalog.map((exercise) => [exercise.id, exercise])
  );
  const entries =
    editing?.exercises ??
    draft?.exercises.flatMap(({ exerciseId, sets }) => {
      const exercise = catalogById.get(exerciseId);
      return exercise ? [{ exercise, sets }] : [];
    }) ??
    [];
  const summary = summarizeTraining(entries);
  const lastCompleted =
    draft || editing ? null : workspace?.lastCompleted ?? null;
  const performedOn =
    editing?.performedOn ??
    draft?.performedOn ??
    newDate ??
    getTodayDateString();
  const addedIds = new Set(entries.map(({ exercise }) => exercise.id));

  async function addExercises(exercises: TrainingExercise[]) {
    const additions = exercises.filter(({ id }) => !addedIds.has(id));
    if (!additions.length) return;
    if (entries.length + additions.length > MAX_TRAINING_EXERCISES) {
      setError(`La sesión ya tiene ${MAX_TRAINING_EXERCISES} ejercicios.`);
      return;
    }
    if (editing) {
      setEditing({
        ...editing,
        exercises: [
          ...entries,
          ...additions.map((exercise) => ({ exercise, sets: [] })),
        ],
      });
      setTab('session');
      return;
    }
    const next = draft ?? {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      performedOn,
      exercises: [],
    };
    if (
      await saveDraft({
        ...next,
        exercises: [
          ...next.exercises,
          ...additions.map(({ id }) => ({ exerciseId: id, sets: [] })),
        ],
      })
    ) {
      setTab('session');
    }
  }

  function changeDate(date: string) {
    if (!trainingDateSchema.safeParse(date).success || date === performedOn)
      return;
    if (editing) setEditing({ ...editing, performedOn: date });
    else if (draft) void saveDraft({ ...draft, performedOn: date });
    else setNewDate(date);
  }

  async function changeSets(id: string, sets: TrainingSet[]) {
    if (editing) {
      setEditing({
        ...editing,
        exercises: editing.exercises.map((entry) =>
          entry.exercise.id === id ? { ...entry, sets } : entry
        ),
      });
      return true;
    }
    if (!draft) return false;
    return saveDraft({
      ...draft,
      exercises: draft.exercises.map((entry) =>
        entry.exerciseId === id ? { ...entry, sets } : entry
      ),
    });
  }

  function removeExercise(id: string) {
    if (editing) {
      setEditing({
        ...editing,
        exercises: editing.exercises.filter(
          ({ exercise }) => exercise.id !== id
        ),
      });
    } else if (draft) {
      void saveDraft({
        ...draft,
        exercises: draft.exercises.filter(
          ({ exerciseId }) => exerciseId !== id
        ),
      });
    }
  }

  async function createExercise(exercise: TrainingExercise) {
    let saved: TrainingExercise | null = null;
    await mutate(async (current) => {
      saved = await trainingApi.createExercise(exercise);
      return {
        ...current,
        customExercises: [
          ...current.customExercises.filter(({ id }) => id !== exercise.id),
          saved,
        ],
      };
    });
    return saved;
  }

  async function finish() {
    if (!summary.setCount) return;
    if (editing) {
      const { id, revision, performedOn, exercises } = editing;
      const done = await mutate(async (current) => {
        const { lastCompleted } = await trainingApi.editSession(id, {
          revision,
          performedOn,
          exercises: exercises.map(({ exercise, sets }) => ({
            exerciseId: exercise.id,
            sets,
          })),
        });
        return { ...current, lastCompleted };
      });
      if (done) {
        setEditing(null);
        setTab('history');
        setNotice('Sesión actualizada.');
      }
      return;
    }
    if (!draft) return;
    const done = await mutate(async (current) => ({
      ...current,
      ...(await trainingApi.finish({
        revision: current.revision,
        id: draft.id,
      })),
    }));
    if (done) {
      setNewDate(null);
      setNotice('Sesión guardada en el historial.');
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Muscle Log
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Registra tus series y mira qué músculos trabajaste.
          </p>
        </div>
      </header>
      <nav
        aria-label="Muscle Log"
        className="sticky top-16 z-20 grid grid-cols-4 gap-1 rounded-xl border border-slate-800 bg-[#0e1420] p-1 sm:top-20"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={busy || (id === 'history' && Boolean(editing))}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              setNotice('');
              setTab(id);
            }}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-lime-300 sm:text-sm ${
              tab === id
                ? 'bg-lime-300/12 text-lime-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Icon
              size={16}
              aria-hidden="true"
              className="hidden min-[375px]:block"
            />{' '}
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200"
        >
          <p>{error}</p>
          {!editing && (
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setError('');
                setWorkspace(null);
                setLoadAttempt((previous) => previous + 1);
              }}
            >
              Actualizar sesión
            </button>
          )}
        </div>
      )}
      {busy && (
        <p role="status" className="text-sm text-slate-400">
          Guardando…
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm font-semibold text-lime-200">
          {notice}
        </p>
      )}
      {!workspace ? (
        !error && (
          <p role="status" className="text-sm text-slate-400">
            Cargando entrenamiento…
          </p>
        )
      ) : tab === 'history' ? (
        <TrainingHistory
          onEdit={(session) => {
            setError('');
            setEditing(session);
            setTab('session');
          }}
        />
      ) : tab === 'catalog' ? (
        <TrainingCatalog
          catalog={catalog}
          addedIds={addedIds}
          busy={busy}
          onAdd={(exercise) => void addExercises([exercise])}
          onCreate={createExercise}
        />
      ) : tab === 'routines' ? (
        <TrainingRoutines
          addedIds={addedIds}
          busy={busy}
          onApply={(exercises) => void addExercises(exercises)}
        />
      ) : (
        <TrainingSession
          key={editing?.id ?? draft?.id ?? 'new'}
          summary={summary}
          lastCompleted={lastCompleted}
          entries={entries}
          busy={busy}
          performedOn={performedOn}
          onDateChange={changeDate}
          onOpenCatalog={() => setTab('catalog')}
          onFinish={() => void finish()}
          onSets={changeSets}
          onRemove={removeExercise}
          onCancelEdit={
            editing
              ? () => {
                  setError('');
                  setEditing(null);
                  setTab('history');
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
