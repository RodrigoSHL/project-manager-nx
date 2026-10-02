import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Site } from '../../assets/models';
import {
  normalizeSiteCode,
  siteAdminSchema,
  type SiteAdminFormValue,
} from '../site-admin-schema';

type SiteAdminFormProps = {
  site?: Site | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (value: SiteAdminFormValue) => Promise<void>;
};

const emptyForm: SiteAdminFormValue = {
  code: '',
  name: '',
  type: 'MINE',
  active: true,
};

const siteTypes: Array<{ value: Site['type']; label: string }> = [
  { value: 'MINE', label: 'Mina' },
  { value: 'PLANT', label: 'Planta' },
  { value: 'SITE', label: 'Faena / Sitio' },
];

export function SiteAdminForm({
  site,
  isSubmitting,
  onCancel,
  onSubmit,
}: SiteAdminFormProps) {
  const [form, setForm] = useState<SiteAdminFormValue>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      site
        ? {
            code: site.code,
            name: site.name,
            type: site.type,
            active: site.active,
          }
        : emptyForm
    );
    setError(null);
  }, [site]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = siteAdminSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los campos.');
      return;
    }

    setError(null);
    try {
      await onSubmit(result.data);
    } catch {
      // La página presenta el mensaje entregado por la API.
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">
            {site ? 'Editar ubicación' : 'Nueva ubicación'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Esta ubicación quedará asociada únicamente a la empresa
            seleccionada.
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
                code: normalizeSiteCode(event.target.value),
              }))
            }
            maxLength={40}
            placeholder="MINA_NORTE"
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
            placeholder="Mina Norte"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Tipo de ubicación
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as Site['type'],
              }))
            }
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {siteTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-auto flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700">
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
          Ubicación activa
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar ubicación'}
          </Button>
        </div>
      </form>
    </section>
  );
}
