import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardList,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react';
import { CatalogItemForm } from '../components/catalog-item-form';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import type { CatalogItemFormValue } from '../features/catalogs/catalog-item-schema';
import { useReferenceCatalog } from '../features/catalogs/use-reference-catalog';
import { useConceptCatalog } from '../features/concepts/use-concept-catalog';
import { WorkTypeFormTemplatePanel } from '../features/form-templates/components/work-type-form-template-panel';
import { useFormTemplateCatalog } from '../features/form-templates/use-form-template-catalog';
import type { WorkType } from '../features/work-types/models';

export function AdminWorkTypesPage() {
  const catalog = useReferenceCatalog();
  const conceptCatalog = useConceptCatalog(
    catalog.tenantId,
    catalog.assetTypes
  );
  const formCatalog = useFormTemplateCatalog(
    catalog.tenantId,
    catalog.workTypes,
    conceptCatalog.concepts
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WorkType | null | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedId((current) =>
      current && catalog.workTypes.some((item) => item.id === current)
        ? current
        : catalog.workTypes[0]?.id ?? null
    );
  }, [catalog.workTypes]);

  useEffect(() => {
    setEditing(undefined);
    setSearchQuery('');
  }, [catalog.tenantId]);

  const selected = catalog.workTypes.find((item) => item.id === selectedId);
  const filteredWorkTypes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    if (!query) return catalog.workTypes;
    return catalog.workTypes.filter(
      (item) =>
        item.name.toLocaleLowerCase('es').includes(query) ||
        item.code.toLocaleLowerCase('es').includes(query)
    );
  }, [catalog.workTypes, searchQuery]);

  async function save(value: CatalogItemFormValue) {
    if (editing) {
      await catalog.updateWorkType(editing.id, value);
    } else {
      const created = await catalog.createWorkType(value);
      if (created) setSelectedId(created.id);
    }
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
            Administra cada clase de trabajo y construye la plantilla que
            utilizará el técnico en una fase posterior.
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
          onChange={catalog.selectTenant}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Tipos de trabajo y conceptos: PostgreSQL.</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <ClipboardList className="size-3.5" /> Plantillas: mock durante esta
            sesión.
          </span>
        </div>
      </div>

      {catalog.error || catalog.mutationError || conceptCatalog.error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />{' '}
            {catalog.mutationError ?? catalog.error ?? conceptCatalog.error}
          </div>
          {catalog.error || conceptCatalog.error ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                catalog.retry();
                void conceptCatalog.retry();
              }}
            >
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

      {catalog.isLoading || conceptCatalog.isLoading ? (
        <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white">
          <LoaderCircle className="size-7 animate-spin text-slate-500" />
        </div>
      ) : null}

      {!catalog.isLoading &&
      !catalog.error &&
      !conceptCatalog.isLoading &&
      !conceptCatalog.error ? (
        <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(28rem,1.3fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col">
            <div className="shrink-0 border-b border-slate-200 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Catálogo de trabajos
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Selecciona uno para editar su formulario.
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {filteredWorkTypes.length} visibles
                </span>
              </div>
              <label className="relative mt-3 block">
                <span className="sr-only">Buscar tipos de trabajo</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
            <div className="min-w-0 p-2 sm:p-3 lg:flex-1 lg:overflow-y-auto">
              <CatalogList
                layout="list"
                items={filteredWorkTypes}
                emptyMessage="No hay tipos de trabajo que coincidan con la búsqueda."
                selectedId={selectedId}
                isMutating={catalog.isMutating}
                onSelect={(item) => setSelectedId(item.id)}
                onEdit={(item) =>
                  setEditing(
                    catalog.workTypes.find(
                      (candidate) => candidate.id === item.id
                    )
                  )
                }
                onToggleActive={(item) =>
                  void catalog.updateWorkType(item.id, {
                    active: !item.active,
                  })
                }
              />
            </div>
          </section>

          {selected ? (
            <WorkTypeFormTemplatePanel
              tenantId={catalog.tenantId}
              workType={selected}
              assetTypes={catalog.assetTypes}
              concepts={conceptCatalog.concepts}
              conceptOptions={conceptCatalog.options}
              assetTypeConcepts={conceptCatalog.assetTypeConcepts}
              catalog={formCatalog}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Selecciona un tipo de trabajo para configurar su formulario.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
