import { useState, type ClipboardEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  MAX_TRAINING_SETS,
  type StrengthTrainingSet,
} from '@project-manager/macrofit-contracts';
import {
  formatTrainingDay,
  parseStrengthInput,
  parseStrengthValues,
  strengthInput,
  type StrengthEdits,
  type StrengthInput,
} from './training-model';
import { fieldClass, primaryButton, secondaryButton } from './training-styles';

export type PreviousStrength = { day: string; sets: StrengthTrainingSet[] };

export function StrengthSetTable({
  sets,
  previous,
  edits,
  busy,
  suggestFour,
  onEdit,
  onSave,
}: {
  sets: StrengthTrainingSet[];
  previous?: PreviousStrength;
  edits: StrengthEdits;
  busy: boolean;
  suggestFour: boolean;
  onEdit: (changes: StrengthEdits) => void;
  onSave: (sets: StrengthTrainingSet[]) => Promise<boolean>;
}) {
  const [planned, setPlanned] = useState<Partial<StrengthInput>[]>([]);
  const [extra, setExtra] = useState(false);
  const [pasteError, setPasteError] = useState('');
  const plannedCount =
    suggestFour && sets.length < 4
      ? 4 - sets.length
      : Number(extra && sets.length < MAX_TRAINING_SETS);
  const proposed = Array.from({ length: plannedCount }, (_, index) => ({
    ...strengthInput(
      previous?.sets[sets.length + index] ??
        previous?.sets.at(-1) ??
        sets.at(-1)
    ),
    ...planned[index],
  }));
  const rows = [
    ...sets.map((set) => edits[set.id] ?? strengthInput(set)),
    ...proposed,
  ];
  const recorded = sets.map((set, index) =>
    parseStrengthInput(set.id, rows[index])
  );
  const validRecorded = recorded.filter(
    (set): set is StrengthTrainingSet => set !== null
  );
  const changed = sets.some(({ id }) => Boolean(edits[id]));
  const proposedIsValid = proposed.map((values) =>
    Boolean(parseStrengthValues(values))
  );
  const invalid = validRecorded.length !== sets.length;

  function changeRows(start: number, updates: Partial<StrengthInput>[]) {
    setPasteError('');
    const changes: StrengthEdits = {};
    const next = [...planned];
    updates.forEach((values, index) => {
      const row = start + index;
      if (row < sets.length)
        changes[sets[row].id] = { ...rows[row], ...values };
      else {
        const position = row - sets.length;
        next[position] = { ...next[position], ...values };
      }
    });
    if (Object.keys(changes).length) onEdit(changes);
    if (start + updates.length > sets.length) setPlanned(next);
  }

  function paste(
    event: ClipboardEvent<HTMLInputElement>,
    start: number,
    column: keyof StrengthInput
  ) {
    const text = event.clipboardData.getData('text').replace(/(?:\r?\n)+$/, '');
    if (!/[\t\n]/.test(text)) return;
    event.preventDefault();
    const lines = text.split(/\r?\n/);
    if (start + lines.length > rows.length) {
      setPasteError(
        'Hay más filas copiadas que series disponibles en la tabla.'
      );
      return;
    }
    const updates = lines.map((line) => {
      const [first, second] = line.split('\t');
      if (column === 'weight') return { weight: first.trim() };
      return second === undefined
        ? { reps: first.trim() }
        : { reps: first.trim(), weight: second.trim() };
    });
    changeRows(start, updates);
  }

  async function record(count: number) {
    if (busy || invalid || !proposedIsValid.slice(0, count).every(Boolean))
      return;
    const next = proposed.slice(0, count).flatMap((values) => {
      const set = parseStrengthInput(crypto.randomUUID(), values);
      return set ? [set] : [];
    });
    if (next.length === count && (await onSave([...validRecorded, ...next]))) {
      setPlanned(planned.slice(count));
      setExtra(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {previous && plannedCount > 0 && (
        <p className="text-xs text-slate-400">
          Sugerencia de tu sesión del {formatTrainingDay(previous.day)}. Puedes
          ajustar cada fila.
        </p>
      )}
      {!previous && plannedCount > 0 && (
        <p className="text-xs text-slate-400">
          Ingresa tus valores y confirma la siguiente serie con ✓.
        </p>
      )}
      <table className="w-full table-fixed border-separate border-spacing-y-1 text-left text-sm">
        <thead className="text-xs text-slate-400">
          <tr>
            <th scope="col" className="w-9 pl-1">
              Serie
            </th>
            <th scope="col" className="px-1">
              Reps.
            </th>
            <th scope="col" className="px-1">
              Peso (kg)
            </th>
            <th scope="col" className="w-12">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((values, index) => {
            const set = sets[index];
            const saved = Boolean(set);
            const firstPlanned = index === sets.length;
            return (
              <tr
                key={set?.id ?? `planned-${index}`}
                className={saved ? 'text-slate-200' : 'text-slate-400'}
              >
                <th
                  scope="row"
                  className="pl-1 text-sm font-semibold tabular-nums"
                >
                  {index + 1}
                  <span className="sr-only">
                    {saved ? ' registrada' : ' pendiente'}
                  </span>
                </th>
                {(['reps', 'weight'] as const).map((column) => (
                  <td className="px-1" key={column}>
                    <input
                      aria-label={`${
                        column === 'reps' ? 'Repeticiones' : 'Peso (kg)'
                      } · serie ${index + 1}`}
                      type="text"
                      inputMode={column === 'reps' ? 'numeric' : 'decimal'}
                      autoComplete="off"
                      className={`${fieldClass} px-1.5 tabular-nums`}
                      value={values[column]}
                      disabled={busy}
                      onChange={(event) =>
                        changeRows(index, [{ [column]: event.target.value }])
                      }
                      onPaste={(event) => paste(event, index, column)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && firstPlanned) {
                          event.preventDefault();
                          void record(1);
                        }
                      }}
                    />
                  </td>
                ))}
                <td className="pl-1">
                  {saved ? (
                    <button
                      type="button"
                      aria-label={`Eliminar serie ${index + 1}`}
                      disabled={
                        busy ||
                        recorded.some(
                          (value, position) => !value && position !== index
                        )
                      }
                      onClick={() =>
                        void onSave(
                          validRecorded.filter(({ id }) => id !== set.id)
                        )
                      }
                      className={`${secondaryButton} min-w-11 px-0`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  ) : firstPlanned ? (
                    <button
                      type="button"
                      aria-label="Registrar serie"
                      disabled={busy || invalid || !proposedIsValid[0]}
                      onClick={() => void record(1)}
                      className={`${secondaryButton} min-w-11 px-0`}
                    >
                      <Check size={17} aria-hidden="true" />
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2">
        {proposed.length > 1 && (
          <button
            className={primaryButton}
            type="button"
            disabled={busy || invalid || !proposedIsValid.every(Boolean)}
            onClick={() => void record(proposed.length)}
          >
            <Check size={16} aria-hidden="true" /> Registrar {proposed.length}{' '}
            series
          </button>
        )}
        {!previous &&
          proposed.length > 1 &&
          proposedIsValid[0] &&
          !proposedIsValid.every(Boolean) && (
            <button
              className={secondaryButton}
              type="button"
              disabled={busy}
              onClick={() =>
                changeRows(
                  sets.length + 1,
                  proposed
                    .slice(1)
                    .map((values, index) =>
                      proposedIsValid[index + 1] ? values : proposed[0]
                    )
                )
              }
            >
              Rellenar series pendientes
            </button>
          )}
        {changed && (
          <button
            className={secondaryButton}
            type="button"
            disabled={busy || invalid}
            onClick={() => void onSave(validRecorded)}
          >
            Guardar cambios
          </button>
        )}
        {plannedCount === 0 && sets.length < MAX_TRAINING_SETS && (
          <button
            className={secondaryButton}
            type="button"
            disabled={busy}
            onClick={() => setExtra(true)}
          >
            <Plus size={16} aria-hidden="true" /> Otra serie
          </button>
        )}
      </div>
      {invalid && (
        <p role="alert" className="text-xs text-rose-300">
          Revisa las repeticiones y el peso de las series registradas.
        </p>
      )}
      {pasteError && (
        <p role="alert" className="text-xs text-rose-300">
          {pasteError}
        </p>
      )}
    </div>
  );
}
