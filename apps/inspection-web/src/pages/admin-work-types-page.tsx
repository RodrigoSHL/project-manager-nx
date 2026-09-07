import { useState } from 'react';
import { AlertCircle, LoaderCircle, Plus } from 'lucide-react';
import { CatalogItemForm } from '../components/catalog-item-form';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import type { CatalogItemFormValue } from '../features/catalogs/catalog-item-schema';
import { useReferenceCatalog } from '../features/catalogs/use-reference-catalog';
import type { WorkType } from '../features/work-types/models';

export function AdminWorkTypesPage() {
  const catalog = useReferenceCatalog();
  const [editing, setEditing] = useState<WorkType | null | undefined>();

  async function save(value: CatalogItemFormValue) {
    if (editing) await catalog.updateWorkType(editing.id, value);
    else await catalog.createWorkType(value);
    setEditing(undefined);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Tipos de trabajo
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Administra las clases de trabajo disponibles para asociar a tipos de
            activo o a equipos concretos.
          </p>
        </div>
        <Button type="button" onClick={() => setEditing(null)}>
          <Plus /> Nuevo tipo de trabajo
        </Button>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={catalog.tenants}
          tenantId={catalog.tenantId}
          onChange={(tenantId) => {
            catalog.selectTenant(tenantId);
            setEditing(undefined);
          }}
        />
        <p className="mt-3 text-xs text-slate-500">
          Desactivar conserva sus asociaciones, pero impide usarlo en nuevas
          configuraciones y lo excluye de los trabajos disponibles.
        </p>
      </div>

      {catalog.error || catalog.mutationError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />{' '}
            {catalog.mutationError ?? catalog.error}
          </div>
          {catalog.error ? (
            <Button variant="outline" className="mt-3" onClick={catalog.retry}>
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}

      {editing !== undefined ? (
        <div className="mt-5">
          <CatalogItemForm
            item={editing}
            itemName="tipo de trabajo"
            isSubmitting={catalog.isMutating}
            onCancel={() => setEditing(undefined)}
            onSubmit={save}
          />
        </div>
      ) : null}

      {catalog.isLoading ? (
        <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white">
          <LoaderCircle className="size-7 animate-spin text-slate-500" />
        </div>
      ) : null}

      {!catalog.isLoading && !catalog.error ? (
        <div className="mt-5">
          <CatalogList
            items={catalog.workTypes}
            emptyMessage="Esta empresa no tiene tipos de trabajo configurados."
            isMutating={catalog.isMutating}
            onEdit={(item) =>
              setEditing(
                catalog.workTypes.find((candidate) => candidate.id === item.id)
              )
            }
            onToggleActive={(item) =>
              void catalog.updateWorkType(item.id, { active: !item.active })
            }
          />
        </div>
      ) : null}
    </section>
  );
}
