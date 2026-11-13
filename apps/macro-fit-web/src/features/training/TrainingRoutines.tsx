import { Plus } from 'lucide-react';
import {
  TRAINING_CATALOG,
  type TrainingExercise,
  type TrainingRoutine,
} from '@project-manager/macrofit-contracts';
import { formatCardio, formatTrainingNumber } from './training-model';
import { secondaryButton } from './training-styles';

const catalog = new Map(
  TRAINING_CATALOG.map((exercise) => [exercise.id, exercise])
);
const presets = [
  {
    name: 'Cuerpo completo',
    ids: ['leg-press', 'bench-press', 'cable-row', 'romanian-deadlift'],
  },
  {
    name: 'Piernas',
    ids: ['hack-squat', 'leg-extension', 'leg-curl', 'calf-raise'],
  },
  { name: 'Empuje', ids: ['bench-press', 'overhead-press', 'cable-pushdown'] },
  {
    name: 'Tirón',
    ids: ['lat-pulldown', 'dumbbell-row', 'face-pull', 'dumbbell-curl'],
  },
  { name: 'En casa, sin equipo', ids: ['push-up', 'plank', 'tibialis-raise'] },
];

export function TrainingRoutines({
  busy,
  addedIds,
  personalRoutines,
  onApply,
}: {
  busy: boolean;
  addedIds: ReadonlySet<string>;
  personalRoutines: TrainingRoutine[];
  onApply: (exercises: TrainingExercise[]) => void;
}) {
  function routineCard(
    key: string,
    name: string,
    entries: TrainingRoutine['exercises']
  ) {
    const exercises = entries.map(({ exercise }) => exercise);
    const loaded = exercises.every(({ id }) => addedIds.has(id));
    return (
      <article
        key={key}
        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
      >
        <h3 className="break-words font-semibold">{name}</h3>
        <ul className="flex-1 space-y-2 text-sm text-slate-300">
          {entries.map(({ exercise, sets }) => (
            <li key={exercise.id}>
              {exercise.name}
              {sets.length > 0 && (
                <p className="text-xs leading-relaxed tabular-nums text-slate-400">
                  {sets
                    .map((set) =>
                      'durationMinutes' in set
                        ? formatCardio(set)
                        : `${set.reps} rep × ${formatTrainingNumber(set.weightKg)} kg`
                    )
                    .join(' / ')}
                </p>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-label={loaded ? `${name} en la sesión` : `Cargar rutina ${name}`}
          className={secondaryButton}
          disabled={busy || loaded}
          onClick={() => onApply(exercises)}
        >
          {!loaded && <Plus size={16} aria-hidden="true" />}
          {loaded ? 'En la sesión' : 'Cargar rutina'}
        </button>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="personal-routines-heading"
        className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
      >
        <h2 id="personal-routines-heading" className="text-lg font-bold">
          Mis rutinas
        </h2>
        <p className="text-sm text-slate-400">
          {personalRoutines.length
            ? 'Las series guardadas son una referencia. Al cargar una rutina, registra lo que hagas hoy.'
            : 'Desde Historial, abre una sesión y elige «Guardar como rutina».'}
        </p>
        {personalRoutines.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...personalRoutines]
              .sort((a, b) => a.name.localeCompare(b.name, 'es'))
              .map(({ id, name, exercises }) => routineCard(id, name, exercises))}
          </div>
        )}
      </section>
      <section
        aria-labelledby="training-routines-heading"
        className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
      >
        <h2 id="training-routines-heading" className="text-lg font-bold">
          Rutinas preestablecidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {presets.map(({ name, ids }) =>
            routineCard(
              name,
              name,
              ids.flatMap((id) => {
                const exercise = catalog.get(id);
                return exercise ? [{ exercise, sets: [] }] : [];
              })
            )
          )}
        </div>
      </section>
    </div>
  );
}
