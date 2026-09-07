import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  catalogItemSchema,
  normalizeCatalogCode,
  type CatalogItemFormValue,
} from '../features/catalogs/catalog-item-schema';
import { Button } from './ui/button';

type CatalogItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
};

type CatalogItemFormProps = {
  item?: CatalogItem | null;
  itemName: string;
  isSubmitting: boolean;
  lockCodeAndStatus?: boolean;
  onCancel: () => void;
  onSubmit: (value: CatalogItemFormValue) => Promise<void>;
};

const emptyForm: CatalogItemFormValue = {
  code: '',
  name: '',
  description: null,
  active: true,
};

export function CatalogItemForm({
  item,
  itemName,
  isSubmitting,
  lockCodeAndStatus = false,
  onCancel,
  onSubmit,
}: CatalogItemFormProps) {
  const [form, setForm] = useState<CatalogItemFormValue>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      item
        ? {
            code: item.code,
            name: item.name,
            description: item.description ?? null,
            active: item.active,
          }
        : emptyForm
    );
    setError(null);
  }, [item]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = catalogItemSchema.safeParse({
      ...form,
      description: form.description?.trim() || null,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los campos.');
      return;
    }

    setError(null);
    try {
      await onSubmit(result.data);
    } catch {
      // The page displays the server error returned by the mutation hook.
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">
            {item ? `Editar ${itemName}` : `Nuevo ${itemName}`}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            El código identifica este registro dentro de la empresa.
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
            disabled={lockCodeAndStatus}
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: normalizeCatalogCode(event.target.value),
              }))
            }
            maxLength={80}
            placeholder="EJEMPLO_CODIGO"
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
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

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

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.active}
            disabled={lockCodeAndStatus}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                active: event.target.checked,
              }))
            }
            className="size-4 accent-slate-950"
          />
          Registro activo y disponible para nuevas configuraciones
        </label>

        {lockCodeAndStatus ? (
          <p className="text-xs text-amber-700 sm:col-span-2">
            SUBSTATION identifica las raíces del árbol; su código y estado están
            protegidos.
          </p>
        ) : null}

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
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </section>
  );
}
