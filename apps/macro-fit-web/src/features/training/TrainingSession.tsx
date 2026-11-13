import { useState, type FormEvent } from 'react';
import {
  Check,
  Dumbbell,
  Layers3,
  Pencil,
  Plus,
  Trash2,
  Weight,
  X,
} from 'lucide-react';
import {
  MAX_TRAINING_SETS,
  TRAINING_EQUIPMENT,
  trainingSetSchema,
  type CompletedTraining,
  type TrainingExercise,
  type TrainingSet,
} from '@project-manager/macrofit-contracts';
import { MuscleMap } from './MuscleMap';
import {
  formatTrainingNumber,
  formatTrainingDay,
  summarizeTraining,
} from './training-model';
import { fieldClass, primaryButton, secondaryButton } from './training-styles';

function SetForm({
  defaults,
  editing,
  busy,
  onSubmit,
  onCancel,
}: {
  defaults?: TrainingSet;
  editing: boolean;
  busy: boolean;
  onSubmit: (set: TrainingSet) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<{ reps: string; weight: string } | null>(
    null
  );
  const [error, setError] = useState('');
  const { reps, weight } = input ?? {
    reps: defaults ? String(defaults.reps) : '',
    weight: defaults ? String(defaults.weightKg) : '0',
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const parsed = trainingSetSchema.safeParse({
      id: editing && defaults ? defaults.id : crypto.randomUUID(),
      reps: Number(reps),
      weightKg: weight.trim() === '' ? NaN : Number(weight),
    });
    if (!parsed.success) {
      setError('Ingresa repeticiones enteras y un peso de 0 kg o más.');
      return;
    }
    setError('');
    if (await onSubmit(parsed.data)) setInput(null);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-2 rounded-xl bg-slate-950/55 p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs font-semibold text-slate-300">
          <span>Repeticiones</span>
          <input
            className={fieldClass}
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            step={1}
            required
            value={reps}
            onChange={(event) => setInput({ reps: event.target.value, weight })}
            disabled={busy}
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-300">
          <span>Peso (kg)</span>
          <input
            className={fieldClass}
            type="number"
            inputMode="decimal"
            min={0}
            max={9999}
            step="any"
            required
            value={weight}
            onChange={(event) => setInput({ reps, weight: event.target.value })}
            disabled={busy}
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          className={`${primaryButton} flex-1`}
          type="submit"
          disabled={busy}
        >
          {editing ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          {editing ? 'Guardar cambios' : 'Registrar serie'}
        </button>
        {editing && (
          <button
            className={secondaryButton}
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </form>
  );
}

function ExerciseCard({
  exercise,
  sets,
  busy,
  onSave,
  onRemove,
  allowRemove,
}: {
  exercise: TrainingExercise;
  sets: TrainingSet[];
  busy: boolean;
  onSave: (sets: TrainingSet[]) => Promise<boolean>;
  onRemove: () => void;
  allowRemove: boolean;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const editing = sets.find(({ id }) => id === editId);
  return (
    <article
      aria-label={exercise.name}
      className="rounded-xl border border-slate-800 bg-[#111827] p-3 sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-100">{exercise.name}</h3>
          <p className="text-xs text-slate-400">
            {TRAINING_EQUIPMENT[exercise.equipment]}
          </p>
        </div>
        {(allowRemove || sets.length === 0) && (
          <button
            type="button"
            aria-label={`Quitar ${exercise.name} de la sesión`}
            disabled={busy}
            onClick={onRemove}
            className={secondaryButton}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {sets.length > 0 && (
        <ol className="mt-3 divide-y divide-slate-800">
          {sets.map((set, index) => (
            <li key={set.id} className="flex min-h-12 items-center gap-2 py-1">
              <span className="w-5 text-center text-xs tabular-nums text-slate-400">
                {index + 1}
              </span>
              <span className="flex-1 text-sm tabular-nums">
                {set.reps} rep · {formatTrainingNumber(set.weightKg)} kg
              </span>
              <button
                type="button"
                aria-label={`Editar serie ${index + 1}`}
                disabled={busy}
                onClick={() => setEditId(set.id)}
                className={secondaryButton}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Eliminar serie ${index + 1}`}
                disabled={busy}
                onClick={() =>
                  void onSave(sets.filter(({ id }) => id !== set.id))
                }
                className={secondaryButton}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      )}
      {(editing || sets.length < MAX_TRAINING_SETS) && (
        <SetForm
          key={editing?.id ?? 'new'}
          defaults={editing ?? sets[sets.length - 1]}
          editing={Boolean(editing)}
          busy={busy}
          onCancel={() => setEditId(null)}
          onSubmit={async (next) => {
            const saved = await onSave(
              editing
                ? sets.map((set) => (set.id === next.id ? next : set))
                : [...sets, next]
            );
            if (saved) setEditId(null);
            return saved;
          }}
        />
      )}
    </article>
  );
}

export function TrainingSession({
  summary,
  lastCompleted,
  entries,
  busy,
  performedOn,
  onDateChange,
  onOpenCatalog,
  onSets,
  onRemove,
  onFinish,
  onCancelEdit,
}: {
  summary: ReturnType<typeof summarizeTraining>;
  lastCompleted: CompletedTraining | null;
  entries: Array<{ exercise: TrainingExercise; sets: TrainingSet[] }>;
  busy: boolean;
  performedOn: string;
  onDateChange: (date: string) => void;
  onOpenCatalog: () => void;
  onSets: (id: string, sets: TrainingSet[]) => Promise<boolean>;
  onRemove: (id: string) => void;
  onFinish: () => void;
  onCancelEdit?: () => void;
}) {
  const displayedSummary = lastCompleted
    ? summarizeTraining(lastCompleted.exercises)
    : summary;
  const completedLabel = lastCompleted
    ? `Última sesión · ${formatTrainingDay(lastCompleted.performedOn)}`
    : undefined;
  const metrics = [
    {
      label: 'Ejercicios',
      value: displayedSummary.exerciseCount,
      icon: Dumbbell,
    },
    { label: 'Series', value: displayedSummary.setCount, icon: Layers3 },
    {
      label: 'Volumen externo',
      value: displayedSummary.volume,
      unit: 'kg',
      icon: Weight,
    },
  ];

  return (
    <div className="space-y-4">
      {completedLabel && (
        <p className="text-sm font-medium text-slate-400">{completedLabel}</p>
      )}
      <dl
        className="grid grid-cols-3 gap-2 sm:gap-3"
        aria-label="Resumen de la sesión"
        aria-live="polite"
      >
        {metrics.map(({ label, value, unit, icon: Icon }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-slate-800 bg-[#101624] px-2.5 py-3 sm:flex sm:items-center sm:gap-3 sm:px-4"
          >
            <Icon
              size={18}
              className="mb-1 text-lime-300 sm:mb-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-slate-400 sm:text-xs">
                {label}
              </dt>
              <dd className="break-words text-lg font-extrabold tabular-nums sm:text-2xl">
                {formatTrainingNumber(value)}
                {unit && (
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    {unit}
                  </span>
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section
          aria-labelledby="training-session-heading"
          className="space-y-3 rounded-2xl border border-slate-800 bg-[#101624] p-3 sm:p-5 xl:col-start-2 xl:row-start-1"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="training-session-heading" className="text-lg font-bold">
              {onCancelEdit ? 'Editar sesión guardada' : 'Sesión actual'}
            </h2>
            <a
              className="inline-flex min-h-11 items-center text-sm font-semibold text-lime-300 xl:hidden"
              href="#muscle-map"
            >
              Ver mapa
            </a>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Fecha del entrenamiento</span>
            <input
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              className={`${fieldClass} max-w-xs`}
              value={performedOn}
              disabled={busy}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={`${primaryButton} w-full`}
            disabled={busy}
            onClick={onOpenCatalog}
          >
            <Plus size={18} aria-hidden="true" /> Agregar ejercicio
          </button>
          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-400">
              Busca un ejercicio para registrar tu primera serie.
            </p>
          ) : (
            entries.map(({ exercise, sets }) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                sets={sets}
                busy={busy}
                allowRemove={Boolean(onCancelEdit)}
                onSave={(next) => onSets(exercise.id, next)}
                onRemove={() => onRemove(exercise.id)}
              />
            ))
          )}
          {(summary.setCount > 0 || onCancelEdit) && (
            <button
              type="button"
              className={`${secondaryButton} w-full`}
              disabled={busy || summary.setCount === 0}
              onClick={onFinish}
            >
              <Check size={18} aria-hidden="true" />{' '}
              {onCancelEdit ? 'Guardar sesión' : 'Finalizar sesión'}
            </button>
          )}
          {onCancelEdit && (
            <button
              type="button"
              className={`${secondaryButton} w-full`}
              disabled={busy}
              onClick={onCancelEdit}
            >
              Cancelar edición
            </button>
          )}
        </section>
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <MuscleMap
            scores={displayedSummary.muscles}
            showingLastSession={Boolean(lastCompleted)}
          />
        </div>
      </div>
    </div>
  );
}
