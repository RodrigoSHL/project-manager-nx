import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { formTemplateSchema } from '../form-template-schema';
import type { FormTemplate, FormTemplateInput } from '../models';

type FormTemplateFormProps = {
  template?: FormTemplate | null;
  onCancel: () => void;
  onSubmit: (input: FormTemplateInput) => void;
};

export function FormTemplateForm({
  template,
  onCancel,
  onSubmit,
}: FormTemplateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(template?.name ?? '');
    setDescription(template?.description ?? '');
    setActive(template?.active ?? true);
    setError(null);
  }, [template]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = formTemplateSchema.safeParse({
      name,
      description: description || null,
      active,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa el formulario.');
      return;
    }
    try {
      onSubmit(result.data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible guardar la plantilla.'
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-300 bg-slate-50 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900">
            {template ? 'Editar formulario' : 'Crear formulario'}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            La versión inicial será v1 y aún no contiene respuestas.
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

      <div className="mt-4 grid gap-4">
        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mantenimiento preventivo de transformador"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Descripción
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="size-4 accent-slate-950"
          />
          Plantilla activa
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar formulario</Button>
      </div>
    </form>
  );
}
