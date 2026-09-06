import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  assetAdminSchema,
  assetToAdminForm,
  emptyAssetAdminForm,
  type AssetAdminForm,
} from '../asset-admin-schema';
import type { Asset } from '../models';

type AssetAdminFormProps = {
  asset: Asset | null;
  assets: Asset[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (form: AssetAdminForm) => Promise<void>;
};

const statusOptions: Array<{ value: Asset['status']; label: string }> = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de servicio' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

export function AssetAdminForm({
  asset,
  assets,
  isSubmitting,
  onCancel,
  onSubmit,
}: AssetAdminFormProps) {
  const [form, setForm] = useState<AssetAdminForm>(emptyAssetAdminForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(asset ? assetToAdminForm(asset) : emptyAssetAdminForm);
    setError(null);
  }, [asset]);

  const assetTypes = useMemo(
    () =>
      Array.from(
        new Set(['SUBSTATION', ...assets.map((item) => item.type)])
      ).sort(),
    [assets]
  );

  function updateField<K extends keyof AssetAdminForm>(
    field: K,
    value: AssetAdminForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = assetAdminSchema.safeParse({
      ...form,
      description: form.description?.trim() || null,
      type: form.type.trim().toUpperCase(),
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los campos.');
      return;
    }

    setError(null);
    try {
      await onSubmit(result.data);
    } catch {
      // The mutation hook exposes the server error in the page.
    }
  }

  const availableParents = assets.filter((item) => item.id !== asset?.id);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">
            {asset ? 'Editar activo' : 'Nuevo activo'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Los activos raíz deben ser subestaciones. Los demás se vinculan a un
            activo padre.
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

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Código / TAG
          <input
            required
            value={form.code}
            onChange={(event) => updateField('code', event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            maxLength={60}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            maxLength={180}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Tipo de activo
          <input
            required
            list="asset-type-options"
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            maxLength={80}
          />
          <datalist id="asset-type-options">
            {assetTypes.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Estado
          <select
            value={form.status}
            onChange={(event) =>
              updateField('status', event.target.value as Asset['status'])
            }
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Activo padre
          <select
            value={form.parentId ?? ''}
            onChange={(event) =>
              updateField('parentId', event.target.value || null)
            }
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Sin padre · nodo raíz</option>
            {availableParents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.code} · {parent.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Descripción
          <textarea
            value={form.description ?? ''}
            onChange={(event) =>
              updateField('description', event.target.value || null)
            }
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            maxLength={2000}
          />
        </label>

        {error ? (
          <p className="md:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar activo'}
          </Button>
        </div>
      </form>
    </section>
  );
}
