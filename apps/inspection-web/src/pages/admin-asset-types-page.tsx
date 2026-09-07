import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, LoaderCircle, Plus, Search } from 'lucide-react';
import { CatalogItemForm } from '../components/catalog-item-form';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import type { AssetType } from '../features/asset-types/models';
import type { CatalogItemFormValue } from '../features/catalogs/catalog-item-schema';
import { useReferenceCatalog } from '../features/catalogs/use-reference-catalog';
import { AssetTypeWorkTypesPanel } from '../features/work-types/components/asset-type-work-types-panel';

export function AdminAssetTypesPage() {
  const catalog = useReferenceCatalog();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AssetType | null | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedId((current) =>
      current && catalog.assetTypes.some((item) => item.id === current)
        ? current
        : catalog.assetTypes[0]?.id ?? null
    );
  }, [catalog.assetTypes]);

  useEffect(() => {
    setEditing(undefined);
    setSearchQuery('');
  }, [catalog.tenantId]);

  const selected = catalog.assetTypes.find((item) => item.id === selectedId);
  const filteredAssetTypes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    if (!query) return catalog.assetTypes;
    return catalog.assetTypes.filter(
      (item) =>
        item.name.toLocaleLowerCase('es').includes(query) ||
        item.code.toLocaleLowerCase('es').includes(query)
    );
  }, [catalog.assetTypes, searchQuery]);

  async function save(value: CatalogItemFormValue) {
    if (editing) {
      await catalog.updateAssetType(editing.id, value);
    } else {
      const created = await catalog.createAssetType(value);
      if (created) setSelectedId(created.id);
    }
    setEditing(undefined);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Tipos de activos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Crea las clases de equipos y define qué tipos de trabajo heredan sus
            activos.
          </p>
        </div>
        <Button type="button" onClick={() => setEditing(null)}>
          <Plus /> Nuevo tipo de activo
        </Button>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={catalog.tenants}
          tenantId={catalog.tenantId}
          onChange={catalog.selectTenant}
        />
        <p className="mt-3 text-xs text-slate-500">
          Los registros y asociaciones se guardan solamente para esta empresa.
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
            itemName="tipo de activo"
            isSubmitting={catalog.isMutating}
            lockCodeAndStatus={editing?.code === 'SUBSTATION'}
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
        <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.9fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col">
            <div className="shrink-0 border-b border-slate-200 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Catálogo de tipos
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {catalog.assetTypes.length} tipos configurados
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {filteredAssetTypes.length} visibles
                </span>
              </div>

              <label className="relative mt-3 block">
                <span className="sr-only">Buscar tipos de activo</span>
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
                items={filteredAssetTypes}
                emptyMessage={
                  searchQuery
                    ? 'No hay tipos que coincidan con la búsqueda.'
                    : 'Esta empresa no tiene tipos de activos configurados.'
                }
                selectedId={selectedId}
                isMutating={catalog.isMutating}
                onSelect={(item) => setSelectedId(item.id)}
                onEdit={(item) =>
                  setEditing(
                    catalog.assetTypes.find(
                      (candidate) => candidate.id === item.id
                    )
                  )
                }
                onToggleActive={(item) =>
                  void catalog.updateAssetType(item.id, {
                    active: !item.active,
                  })
                }
                canToggleActive={(item) => item.code !== 'SUBSTATION'}
              />
            </div>
          </section>

          {selected ? (
            <div className="min-w-0 lg:sticky lg:top-24">
              <AssetTypeWorkTypesPanel
                tenantId={catalog.tenantId}
                assetType={selected}
                workTypes={catalog.workTypes}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Selecciona un tipo de activo para configurar sus trabajos.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
