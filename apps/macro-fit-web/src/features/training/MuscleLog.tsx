import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  Dumbbell,
  History,
  ListChecks,
} from 'lucide-react';
import {
  MAX_TRAINING_EXERCISES,
  TRAINING_CATALOG,
  TRAINING_MUSCLES,
  trainingDateSchema,
  type CompletedTraining,
  type CreateTrainingRoutine,
  type TrainingDraft,
  type TrainingExercise,
  type TrainingMuscle,
  type TrainingSet,
  type TrainingWorkspace,
} from '@project-manager/macrofit-contracts';
import { TrainingCatalog } from './TrainingCatalog';
import { TrainingHistory } from './TrainingHistory';
import { TrainingProgress } from './TrainingProgress';
import { TrainingRoutines } from './TrainingRoutines';
import { TrainingSession } from './TrainingSession';
import type { PreviousStrength } from './StrengthSetTable';
import { trainingApi } from './training-api';
import {
  parseStrengthInput,
  summarizeTraining,
  type StrengthEdits,
} from './training-model';
import { secondaryButton } from './training-styles';
import { getTodayDateString } from '../../hooks/useMacroStore';

const tabs = [
  { id: 'progress', label: 'Progreso', icon: Activity },
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

function usePreviousStrength(
  exerciseIds: string,
  day: string,
  excludedId?: string
) {
  const [result, setResult] = useState<{
    key: string;
    exercises: Record<string, PreviousStrength>;
  }>();
  const key = JSON.stringify([exerciseIds, day, excludedId]);
  useEffect(() => {
    if (!exerciseIds) return;
    let active = true;
    const missing = new Set(exerciseIds.split('|'));
    async function load() {
      try {
        let offset: number | null = 0;
        const exercises: Record<string, PreviousStrength> = {};
        while (active && missing.size && offset !== null) {
          const page = await trainingApi.history(offset);
          if (!active) return;
          for (const session of page.sessions) {
            if (session.id === excludedId || session.performedOn > day)
              continue;
            for (const { exercise, sets } of session.exercises) {
              if (!missing.has(exercise.id)) continue;
              const strength = sets.filter((set) => 'reps' in set);
              if (!strength.length) continue;
              missing.delete(exercise.id);
              exercises[exercise.id] = {
                day: session.performedOn,
                sets: strength,
              };
            }
          }
          setResult({ key, exercises: { ...exercises } });
          offset = page.nextOffset;
        }
      } catch {
        // The table stays editable when the history is unavailable.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [exerciseIds, day, excludedId, key]);
  return result?.key === key ? result.exercises : {};
}

export default function MuscleLog() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('progress');
  const [workspace, setWorkspace] = useState<TrainingWorkspace | null>(null);
  const [editing, setEditing] = useState<CompletedTraining | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogMuscle, setCatalogMuscle] = useState<TrainingMuscle | ''>('');
  const [highlightedExercise, setHighlightedExercise] = useState<{
    id: string;
  } | null>(null);
  const [draftStrengthEdits, setDraftStrengthEdits] = useState<StrengthEdits>(
    {}
  );
  const [historyStrengthEdits, setHistoryStrengthEdits] =
    useState<StrengthEdits>({});
  const strengthEdits = editing ? historyStrengthEdits : draftStrengthEdits;
  const setStrengthEdits = editing
    ? setHistoryStrengthEdits
    : setDraftStrengthEdits;
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
  const draftEntries =
    draft?.exercises.flatMap(({ exerciseId, sets }) => {
      const exercise = catalogById.get(exerciseId);
      return exercise ? [{ exercise, sets }] : [];
    }) ?? [];
  const entries = editing?.exercises ?? draftEntries;
  let invalidStrength = false;
  let hasStrengthEdits = false;
  const editedEntries = entries.map((entry) => ({
    ...entry,
    sets: entry.sets.map((set) => {
      if (!('reps' in set) || !strengthEdits[set.id]) return set;
      hasStrengthEdits = true;
      const changed = parseStrengthInput(set.id, strengthEdits[set.id]);
      if (!changed) invalidStrength = true;
      return changed ?? set;
    }),
  }));
  const summary = summarizeTraining(editing ? editedEntries : entries);
  const lastCompleted =
    draft || editing ? null : workspace?.lastCompleted ?? null;
  const performedOn =
    editing?.performedOn ??
    draft?.performedOn ??
    newDate ??
    getTodayDateString();
  const addedIds = new Set(entries.map(({ exercise }) => exercise.id));
  const previousStrength = usePreviousStrength(
    tab === 'session'
      ? entries
          .filter(({ exercise }) => exercise.kind !== 'cardio')
          .map(({ exercise }) => exercise.id)
          .sort()
          .join('|')
      : '',
    performedOn,
    editing?.id
  );

  async function addExercises(
    exercises: TrainingExercise[],
    highlight = false
  ) {
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
      setHighlightedExercise(highlight ? { id: additions[0].id } : null);
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
      setHighlightedExercise(highlight ? { id: additions[0].id } : null);
      setTab('session');
    }
  }

  function openCatalog(muscle: TrainingMuscle | '' = '') {
    setCatalogMuscle(muscle);
    setTab('catalog');
  }

  function muscleExercises(muscle: TrainingMuscle) {
    const suggestions = catalog
      .filter(
        (exercise) =>
          exercise.kind !== 'cardio' && exercise.primary.includes(muscle)
      )
      .slice(0, 3);
    return (
      <div className="mt-3 space-y-2 rounded-xl border border-slate-800 p-3">
        <p className="text-sm font-semibold">{TRAINING_MUSCLES[muscle]}</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              disabled={busy}
              className={secondaryButton}
              onClick={() => {
                if (addedIds.has(exercise.id)) {
                  setHighlightedExercise({ id: exercise.id });
                  setTab('session');
                } else void addExercises([exercise], true);
              }}
            >
              {addedIds.has(exercise.id) ? 'Abrir' : 'Agregar'} {exercise.name}
            </button>
          ))}
          <button
            type="button"
            className={secondaryButton}
            disabled={busy}
            onClick={() => openCatalog(muscle)}
          >
            Ver ejercicios de {TRAINING_MUSCLES[muscle].toLowerCase()}
          </button>
        </div>
      </div>
    );
  }

  function changeDate(date: string) {
    if (!trainingDateSchema.safeParse(date).success || date === performedOn)
      return;
    if (editing) setEditing({ ...editing, performedOn: date });
    else if (draft) void saveDraft({ ...draft, performedOn: date });
    else setNewDate(date);
  }

  async function changeSets(id: string, sets: TrainingSet[]) {
    const setIds = new Set(
      entries
        .find(({ exercise }) => exercise.id === id)
        ?.sets.map(({ id }) => id)
    );
    function clearSavedEdits() {
      setStrengthEdits((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => !setIds.has(id))
        )
      );
    }
    if (editing) {
      setEditing({
        ...editing,
        exercises: editing.exercises.map((entry) =>
          entry.exercise.id === id ? { ...entry, sets } : entry
        ),
      });
      clearSavedEdits();
      return true;
    }
    if (!draft) return false;
    const saved = await saveDraft({
      ...draft,
      exercises: draft.exercises.map((entry) =>
        entry.exerciseId === id ? { ...entry, sets } : entry
      ),
    });
    if (saved) clearSavedEdits();
    return saved;
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

  async function saveRoutine(input: CreateTrainingRoutine) {
    const saved = await mutate(async (current) => {
      const routine = await trainingApi.createRoutine(input);
      return {
        ...current,
        routines: [
          ...(current.routines ?? []).filter(({ id }) => id !== routine.id),
          routine,
        ],
      };
    });
    if (saved) {
      setTab('routines');
      setNotice('Rutina guardada en Mis rutinas.');
    }
  }

  async function finish() {
    if (!summary.exerciseCount || invalidStrength) return;
    if (editing) {
      const { id, revision, performedOn } = editing;
      const done = await mutate(async (current) => {
        const { lastCompleted } = await trainingApi.editSession(id, {
          revision,
          performedOn,
          exercises: editedEntries.map(({ exercise, sets }) => ({
            exerciseId: exercise.id,
            sets,
          })),
        });
        return { ...current, lastCompleted };
      });
      if (done) {
        setStrengthEdits({});
        setEditing(null);
        setTab('history');
        setNotice('Sesión actualizada.');
      }
      return;
    }
    if (!draft) return;
    let finished = false;
    await mutate(async (current) => {
      const staged = hasStrengthEdits
        ? {
            ...current,
            ...(await trainingApi.saveDraft({
              revision: current.revision,
              draft: {
                ...draft,
                exercises: editedEntries.map(({ exercise, sets }) => ({
                  exerciseId: exercise.id,
                  sets,
                })),
              },
            })),
          }
        : current;
      try {
        const state = await trainingApi.finish({
          revision: staged.revision,
          id: draft.id,
        });
        finished = true;
        return { ...staged, ...state };
      } catch (failure) {
        if (staged === current) throw failure;
        setStrengthEdits({});
        setError(errorMessage(failure));
        return staged;
      }
    });
    if (finished) {
      setStrengthEdits({});
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
        className="sticky top-16 z-20 grid grid-cols-5 gap-1 rounded-xl border border-slate-800 bg-[#0e1420] p-1 sm:top-20"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={busy || (id === 'history' && Boolean(editing))}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              setNotice('');
              setHighlightedExercise(null);
              if (id === 'catalog') setCatalogMuscle('');
              setTab(id);
            }}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-lime-300 sm:text-sm ${
              tab === id
                ? 'bg-lime-300/12 text-lime-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Icon size={16} aria-hidden="true" className="hidden sm:block" />{' '}
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
                setDraftStrengthEdits({});
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
      ) : tab === 'progress' ? (
        <TrainingProgress
          live={
            draft
              ? {
                  id: draft.id,
                  performedOn: draft.performedOn ?? getTodayDateString(),
                  exercises: draftEntries,
                }
              : null
          }
          onOpenSession={() => setTab('session')}
          selectedActions={muscleExercises}
        />
      ) : tab === 'history' ? (
        <TrainingHistory
          busy={busy}
          onSaveRoutine={saveRoutine}
          onEdit={(session) => {
            setError('');
            setHistoryStrengthEdits({});
            setEditing(session);
            setTab('session');
          }}
        />
      ) : tab === 'catalog' ? (
        <TrainingCatalog
          key={catalogMuscle}
          initialMuscle={catalogMuscle}
          catalog={catalog}
          addedIds={addedIds}
          busy={busy}
          onAdd={(exercise) => void addExercises([exercise], true)}
          onCreate={createExercise}
        />
      ) : tab === 'routines' ? (
        <TrainingRoutines
          addedIds={addedIds}
          busy={busy}
          personalRoutines={workspace.routines ?? []}
          onApply={(exercises) => void addExercises(exercises)}
        />
      ) : (
        <TrainingSession
          summary={summary}
          lastCompleted={lastCompleted}
          latest={workspace.lastCompleted}
          draftId={draft?.id}
          editorKey={editing?.id ?? draft?.id ?? 'new'}
          entries={entries}
          busy={busy}
          performedOn={performedOn}
          onDateChange={changeDate}
          onOpenCatalog={() => openCatalog()}
          onFinish={() => void finish()}
          onSets={changeSets}
          selectedActions={muscleExercises}
          previousStrength={previousStrength}
          strengthEdits={strengthEdits}
          onEditStrength={(changes) =>
            setStrengthEdits((current) => ({ ...current, ...changes }))
          }
          highlightedExercise={highlightedExercise}
          invalidStrength={invalidStrength}
          onRemove={removeExercise}
          onCancelEdit={
            editing
              ? () => {
                  setError('');
                  setStrengthEdits({});
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
