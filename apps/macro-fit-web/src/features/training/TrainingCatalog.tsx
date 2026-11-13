import { useState, type FormEvent } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import {
  TRAINING_EQUIPMENT,
  TRAINING_MUSCLES,
  customTrainingExerciseSchema,
  type TrainingEquipment,
  type TrainingExercise,
  type TrainingMuscle,
} from '@project-manager/macrofit-contracts';
import { filterTrainingExercises } from './training-model';
import { TrainingExerciseIcon } from './TrainingExerciseIcon';
import { fieldClass, primaryButton, secondaryButton } from './training-styles';

const equipmentOptions = Object.entries(TRAINING_EQUIPMENT);
const muscleOptions = Object.entries(TRAINING_MUSCLES) as [
  TrainingMuscle,
  string
][];
const PAGE_SIZE = 18;

function CustomExerciseForm({
  busy,
  onCancel,
  onCreate,
}: {
  busy: boolean;
  onCancel: () => void;
  onCreate: (exercise: TrainingExercise) => Promise<TrainingExercise | null>;
}) {
  const [id] = useState(() => crypto.randomUUID());
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<TrainingEquipment>('machine');
  const [muscles, setMuscles] = useState<
    Partial<Record<TrainingMuscle, 'primary' | 'secondary' | ''>>
  >({});
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const parsed = customTrainingExerciseSchema.safeParse({
      id,
      name,
      equipment,
      aliases: [],
      primary: muscleOptions
        .filter(([muscle]) => muscles[muscle] === 'primary')
        .map(([muscle]) => muscle),
      secondary: muscleOptions
        .filter(([muscle]) => muscles[muscle] === 'secondary')
        .map(([muscle]) => muscle),
    });
    if (!parsed.success) {
      setError('Escribe un nombre y selecciona al menos un músculo principal.');
      return;
    }
    setError('');
    await onCreate(parsed.data);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/45 p-3 sm:p-4"
    >
      <h3 className="font-bold">Ejercicio personalizado</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          <span>Nombre del ejercicio</span>
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={busy}
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Equipamiento del ejercicio</span>
          <select
            className={fieldClass}
            value={equipment}
            disabled={busy}
            onChange={(event) =>
              setEquipment(event.target.value as TrainingEquipment)
            }
          >
            {equipmentOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset disabled={busy}>
        <legend className="mb-2 text-sm font-semibold">Músculos</legend>
        <div className="grid gap-2 lg:grid-cols-2">
          {muscleOptions.map(([muscle, label]) => (
            <label
              key={muscle}
              className="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.8fr)] items-center gap-2 rounded-lg bg-slate-900/70 px-2 py-1 text-xs font-medium sm:text-sm"
            >
              <span>{label}</span>
              <select
                className={`${fieldClass} text-sm`}
                value={muscles[muscle] ?? ''}
                onChange={(event) =>
                  setMuscles((previous) => ({
                    ...previous,
                    [muscle]: event.target.value as
                      | 'primary'
                      | 'secondary'
                      | '',
                  }))
                }
              >
                <option value="">Sin seleccionar</option>
                <option value="primary">Principal</option>
                <option value="secondary">Secundario</option>
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButton} disabled={busy}>
          Guardar ejercicio
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TrainingCatalog({
  catalog,
  addedIds,
  busy,
  onAdd,
  onCreate,
}: {
  catalog: readonly TrainingExercise[];
  addedIds: ReadonlySet<string>;
  busy: boolean;
  onAdd: (exercise: TrainingExercise) => void;
  onCreate: (exercise: TrainingExercise) => Promise<TrainingExercise | null>;
}) {
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<TrainingEquipment | ''>('');
  const [muscle, setMuscle] = useState<TrainingMuscle | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const results = filterTrainingExercises(catalog, query, equipment, muscle);
  const visibleResults = results.slice(0, visibleLimit);
  const hasFilters = Boolean(query.trim() || muscle || equipment);

  function clearFilters() {
    setEquipment('');
    setMuscle('');
    setQuery('');
    setVisibleLimit(PAGE_SIZE);
  }

  return (
    <section
      aria-labelledby="training-catalog-heading"
      className="space-y-4 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="training-catalog-heading" className="text-lg font-bold">
          Catálogo de ejercicios
        </h2>
        {!showForm && (
          <button
            type="button"
            className={secondaryButton}
            disabled={busy}
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} aria-hidden="true" /> Crear ejercicio
          </button>
        )}
      </div>
      {showForm && (
        <CustomExerciseForm
          busy={busy}
          onCancel={() => setShowForm(false)}
          onCreate={async (exercise) => {
            const saved = await onCreate(exercise);
            if (saved) {
              clearFilters();
              setQuery(saved.name);
              setShowForm(false);
            }
            return saved;
          }}
        />
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar ejercicio</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
            aria-hidden="true"
          />
          <input
            className={`${fieldClass} pl-9`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleLimit(PAGE_SIZE);
            }}
            placeholder="Nombre, alias o músculo"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por músculo</span>
          <select
            className={fieldClass}
            value={muscle}
            onChange={(event) => {
              setMuscle(event.target.value as TrainingMuscle | '');
              setVisibleLimit(PAGE_SIZE);
            }}
          >
            <option value="">Todos los músculos</option>
            {muscleOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por equipamiento</span>
          <select
            className={fieldClass}
            value={equipment}
            onChange={(event) => {
              setEquipment(event.target.value as TrainingEquipment | '');
              setVisibleLimit(PAGE_SIZE);
            }}
          >
            <option value="">Todo el equipamiento</option>
            {equipmentOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3">
        <p aria-live="polite" className="text-sm text-slate-400">
          {results.length === 1
            ? '1 ejercicio'
            : `${results.length} ejercicios`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 rounded-lg px-2 text-sm font-semibold text-lime-300 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {results.length ? (
        <ul className="grid gap-2 xl:grid-cols-2">
          {visibleResults.map((exercise) => {
            const added = addedIds.has(exercise.id);
            return (
              <li
                key={exercise.id}
                className="flex min-h-20 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-2.5 sm:p-3"
              >
                <TrainingExerciseIcon equipment={exercise.equipment} />
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold sm:text-base">
                    {exercise.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {TRAINING_EQUIPMENT[exercise.equipment]} ·{' '}
                    {exercise.primary
                      .map((muscle) => TRAINING_MUSCLES[muscle])
                      .join(', ')}
                  </p>
                  {muscle && exercise.secondary.includes(muscle) && (
                    <p className="mt-1 text-xs text-slate-400">
                      Músculo secundario · {TRAINING_MUSCLES[muscle]}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={`${secondaryButton} size-11 shrink-0 sm:w-auto`}
                  disabled={busy || added}
                  aria-label={
                    added
                      ? `${exercise.name} en la sesión`
                      : `Agregar ${exercise.name}`
                  }
                  onClick={() => onAdd(exercise)}
                >
                  {added ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Plus size={16} aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {added ? 'En sesión' : 'Agregar'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p role="status" className="py-4 text-sm text-slate-400">
          No encontramos ejercicios con esos filtros.
        </p>
      )}
      {visibleResults.length < results.length && (
        <div className="flex justify-center">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setVisibleLimit((limit) => limit + PAGE_SIZE)}
          >
            Ver más ejercicios
          </button>
        </div>
      )}
    </section>
  );
}
