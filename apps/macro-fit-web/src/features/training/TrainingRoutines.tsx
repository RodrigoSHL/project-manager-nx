import { Plus } from 'lucide-react';
import {
  TRAINING_CATALOG,
  type TrainingExercise,
} from '@project-manager/macrofit-contracts';
import { secondaryButton } from './training-styles';

const catalog = new Map(
  TRAINING_CATALOG.map((exercise) => [exercise.id, exercise])
);
const routines = [
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
  onApply,
}: {
  busy: boolean;
  addedIds: ReadonlySet<string>;
  onApply: (exercises: TrainingExercise[]) => void;
}) {
  return (
    <section
      aria-labelledby="training-routines-heading"
      className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
    >
      <div>
        <h2 id="training-routines-heading" className="text-lg font-bold">
          Rutinas preestablecidas
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Carga los ejercicios y registra las series a tu ritmo.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {routines.map(({ name, ids }) => {
          const exercises = ids.flatMap((id) => {
            const exercise = catalog.get(id);
            return exercise ? [exercise] : [];
          });
          const loaded = exercises.every(({ id }) => addedIds.has(id));
          return (
            <article
              key={name}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <h3 className="font-semibold">{name}</h3>
              <ul className="flex-1 list-inside list-disc space-y-1 text-sm text-slate-300">
                {exercises.map(({ id, name }) => (
                  <li key={id}>{name}</li>
                ))}
              </ul>
              <button
                type="button"
                aria-label={
                  loaded ? `${name} en la sesión` : `Cargar rutina ${name}`
                }
                className={secondaryButton}
                disabled={busy || loaded}
                onClick={() => onApply(exercises)}
              >
                {!loaded && <Plus size={16} aria-hidden="true" />}
                {loaded ? 'En la sesión' : 'Cargar rutina'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
