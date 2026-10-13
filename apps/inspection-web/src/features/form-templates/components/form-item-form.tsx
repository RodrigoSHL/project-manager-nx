import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { conceptTypeLabels } from '../../concepts/concept-schema';
import type { Concept } from '../../concepts/models';
import { formItemSchema } from '../form-template-schema';
import type { FormItem, FormItemInput, FormItemType } from '../models';

type FormItemFormProps = {
  item?: FormItem | null;
  preferredConcepts: Concept[];
  otherConcepts: Concept[];
  usesFallback: boolean;
  conceptsLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: FormItemInput) => void;
};

export function FormItemForm({
  item,
  preferredConcepts,
  otherConcepts,
  usesFallback,
  conceptsLoading,
  onCancel,
  onSubmit,
}: FormItemFormProps) {
  const [type, setType] = useState<FormItemType>('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [required, setRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableConcepts = useMemo(
    () => [...preferredConcepts, ...otherConcepts],
    [otherConcepts, preferredConcepts]
  );

  useEffect(() => {
    setType(item?.type ?? 'TASK');
    setTitle(item?.title ?? '');
    setDescription(item?.description ?? '');
    setConceptId(item?.conceptId ?? '');
    setRequired(item?.required ?? true);
    setError(null);
  }, [item]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = formItemSchema.safeParse({
      type,
      title: title || null,
      description: description || null,
      conceptId: conceptId || null,
      required,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa el elemento.');
      return;
    }
    onSubmit(result.data);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 sm:p-4"
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 p-1">
        {(['TASK', 'CONCEPT'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={`min-h-9 rounded-md px-3 text-sm font-medium transition ${
              type === option
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {option === 'TASK' ? 'Tarea' : 'Concepto'}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        {type === 'TASK' ? (
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Actividad
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Verificar apriete de conexiones"
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-500"
            />
          </label>
        ) : (
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Concepto del catálogo
            <select
              required
              value={conceptId}
              disabled={conceptsLoading}
              onChange={(event) => setConceptId(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-500"
            >
              <option value="">
                {conceptsLoading ? 'Calculando conceptos...' : 'Seleccionar...'}
              </option>
              {preferredConcepts.length > 0 ? (
                <optgroup label="Recomendados para este trabajo">
                  {preferredConcepts.map((concept) => (
                    <ConceptOption key={concept.id} concept={concept} />
                  ))}
                </optgroup>
              ) : null}
              {otherConcepts.length > 0 ? (
                <optgroup
                  label={
                    usesFallback
                      ? 'Conceptos activos del tenant'
                      : 'Otros conceptos del tenant'
                  }
                >
                  {otherConcepts.map((concept) => (
                    <ConceptOption key={concept.id} concept={concept} />
                  ))}
                </optgroup>
              ) : null}
            </select>
            <span className="mt-1 block font-normal leading-4 text-slate-500 dark:text-slate-400">
              {usesFallback
                ? 'No hay conceptos recomendados por compatibilidad; se muestra el catálogo activo de esta empresa.'
                : 'Los conceptos compatibles aparecen primero.'}
            </span>
          </label>
        )}

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Descripción opcional
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 min-h-16 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={required}
            onChange={(event) => setRequired(event.target.checked)}
            className="size-4 accent-slate-950"
          />
          Obligatorio
        </label>
      </div>

      {error ? <p className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p> : null}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={availableConcepts.length === 0 && type === 'CONCEPT'}
        >
          Guardar elemento
        </Button>
      </div>
    </form>
  );
}

function ConceptOption({ concept }: { concept: Concept }) {
  return (
    <option value={concept.id}>
      {concept.name} · {conceptTypeLabels[concept.type]}
    </option>
  );
}
