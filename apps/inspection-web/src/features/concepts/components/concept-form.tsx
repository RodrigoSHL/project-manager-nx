import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  conceptSchema,
  conceptTypeLabels,
  conceptTypes,
  normalizeConceptCode,
} from '../concept-schema';
import type {
  Concept,
  ConceptFormValue,
  ConceptOption,
  ConceptOptionInput,
} from '../models';

type EditableOption = ConceptOptionInput & { key: string };

type ConceptFormProps = {
  concept?: Concept | null;
  options: ConceptOption[];
  onCancel: () => void;
  onSubmit: (value: ConceptFormValue) => void | Promise<void>;
};

const emptyForm: Omit<ConceptFormValue, 'options'> = {
  code: '',
  name: '',
  description: null,
  type: 'ANALOG',
  unit: null,
  active: true,
};

export function ConceptForm({
  concept,
  options,
  onCancel,
  onSubmit,
}: ConceptFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [editableOptions, setEditableOptions] = useState<EditableOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(
      concept
        ? {
            code: concept.code,
            name: concept.name,
            description: concept.description ?? null,
            type: concept.type,
            unit: concept.unit ?? null,
            active: concept.active,
          }
        : emptyForm
    );
    setEditableOptions(
      options
        .filter((option) => option.conceptId === concept?.id)
        .sort((a, b) => a.order - b.order)
        .map((option) => ({ ...option, key: option.id }))
    );
    setError(null);
  }, [concept, options]);

  function addOption() {
    setEditableOptions((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        value: '',
        label: '',
        order: current.length + 1,
        active: true,
      },
    ]);
  }

  function updateOption(
    key: string,
    field: keyof ConceptOptionInput,
    value: string | number | boolean
  ) {
    setEditableOptions((current) =>
      current.map((option) =>
        option.key === key ? { ...option, [field]: value } : option
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = conceptSchema.safeParse({
      ...form,
      options: editableOptions.map((option) => ({
        value: option.value,
        label: option.label,
        order: option.order,
        active: option.active,
      })),
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los campos.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible guardar el concepto.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">
            {concept ? 'Editar concepto' : 'Nuevo concepto'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Define un dato reutilizable; todavía no se ingresan respuestas.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar formulario"
          onClick={onCancel}
        >
          <X />
        </Button>
      </div>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Código
          <input
            required
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: normalizeConceptCode(event.target.value),
              }))
            }
            maxLength={80}
            placeholder="TEMP_AMBIENTE"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            maxLength={160}
            placeholder="Temperatura ambiente"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as ConceptFormValue['type'],
              }))
            }
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {conceptTypes.map((type) => (
              <option key={type} value={type}>
                {conceptTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        {form.type === 'ANALOG' ? (
          <label className="text-sm font-medium text-slate-700">
            Unidad
            <input
              value={form.unit ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unit: event.target.value || null,
                }))
              }
              maxLength={30}
              placeholder="°C, A, kV..."
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        ) : (
          <div className="hidden sm:block" />
        )}

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Descripción
          <textarea
            value={form.description ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value || null,
              }))
            }
            maxLength={2000}
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        {form.type === 'DIGITAL' ? (
          <fieldset className="min-w-0 rounded-xl border border-slate-200 p-3 sm:col-span-2 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <legend className="text-sm font-semibold text-slate-900">
                  Opciones cerradas
                </legend>
                <p className="mt-1 text-xs text-slate-500">
                  Estas serán las respuestas disponibles en un formulario
                  futuro.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addOption}>
                <Plus /> Agregar opción
              </Button>
            </div>

            {editableOptions.length === 0 ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Agrega al menos una opción para el concepto digital.
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                {editableOptions.map((option, index) => (
                  <div
                    key={option.key}
                    className="grid min-w-0 gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[5rem_minmax(8rem,0.8fr)_minmax(10rem,1fr)_2.5rem] sm:items-end"
                  >
                    <label className="text-xs font-medium text-slate-600">
                      Orden
                      <input
                        type="number"
                        min={1}
                        value={option.order}
                        onChange={(event) =>
                          updateOption(
                            option.key,
                            'order',
                            Number(event.target.value)
                          )
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500"
                      />
                    </label>
                    <label className="min-w-0 text-xs font-medium text-slate-600">
                      Valor
                      <input
                        required
                        value={option.value}
                        onChange={(event) =>
                          updateOption(
                            option.key,
                            'value',
                            normalizeConceptCode(event.target.value)
                          )
                        }
                        placeholder="NORMAL"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 font-mono text-xs outline-none focus:border-slate-500"
                      />
                    </label>
                    <label className="min-w-0 text-xs font-medium text-slate-600">
                      Etiqueta
                      <input
                        required
                        value={option.label}
                        onChange={(event) =>
                          updateOption(option.key, 'label', event.target.value)
                        }
                        placeholder="Normal"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar opción ${index + 1}`}
                      className="text-red-600 hover:bg-red-50"
                      onClick={() =>
                        setEditableOptions((current) =>
                          current.filter((item) => item.key !== option.key)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        ) : null}

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                active: event.target.checked,
              }))
            }
            className="size-4 accent-slate-950"
          />
          Concepto activo y disponible para nuevas asociaciones
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 sm:col-span-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar concepto'}
          </Button>
        </div>
      </form>
    </section>
  );
}
