import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { formSectionSchema } from '../form-template-schema';
import type { FormSection, FormSectionInput } from '../models';

type FormSectionFormProps = {
  section?: FormSection | null;
  onCancel: () => void;
  onSubmit: (input: FormSectionInput) => void;
};

export function FormSectionForm({
  section,
  onCancel,
  onSubmit,
}: FormSectionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(section?.title ?? '');
    setDescription(section?.description ?? '');
    setError(null);
  }, [section]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = formSectionSchema.safeParse({
      title,
      description: description || null,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa la sección.');
      return;
    }
    onSubmit(result.data);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"
    >
      <h4 className="text-sm font-semibold text-slate-900">
        {section ? 'Editar sección' : 'Nueva sección'}
      </h4>
      <div className="mt-3 grid gap-3">
        <label className="text-xs font-medium text-slate-600">
          Título
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Inspección visual"
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Descripción opcional
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar sección</Button>
      </div>
    </form>
  );
}
