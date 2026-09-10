import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { PlatformTenant } from '../models';
import {
  normalizeTenantCode,
  platformTenantSchema,
  type PlatformTenantFormValue,
} from '../platform-schema';

type PlatformTenantFormProps = {
  tenant?: PlatformTenant | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (value: PlatformTenantFormValue) => Promise<void>;
};

const emptyForm: PlatformTenantFormValue = {
  code: '',
  name: '',
  active: true,
};

export function PlatformTenantForm({
  tenant,
  isSubmitting,
  onCancel,
  onSubmit,
}: PlatformTenantFormProps) {
  const [form, setForm] = useState<PlatformTenantFormValue>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      tenant
        ? { code: tenant.code, name: tenant.name, active: tenant.active }
        : emptyForm
    );
    setError(null);
  }, [tenant]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = platformTenantSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los campos.');
      return;
    }
    setError(null);
    try {
      await onSubmit(result.data);
    } catch {
      // The page keeps the form open and displays the API error above it.
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            {tenant ? 'Edición' : 'Alta de cliente'}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {tenant ? tenant.name : 'Nuevo cliente'}
          </h2>
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

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Código
          <input
            required
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: normalizeTenantCode(event.target.value),
              }))
            }
            maxLength={50}
            placeholder="MINERA_NUEVA"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Identificador único dentro de la plataforma.
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Nombre de la empresa
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            maxLength={160}
            placeholder="Empresa Minera Nueva"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                active: event.target.checked,
              }))
            }
            className="mt-0.5 size-4 accent-slate-950"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Cliente activo
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Al desactivarlo deja de aparecer en la operación, pero sus datos
              se conservan.
            </span>
          </span>
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
          </Button>
        </div>
      </form>
    </section>
  );
}
