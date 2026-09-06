import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { useReferenceCatalog } from '../features/catalogs/use-reference-catalog';

export function AdminWorkTypesPage() {
  const catalog = useReferenceCatalog();

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Tipos de trabajo</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Clases de trabajo que pueden habilitarse para tipos de activo o equipos
        concretos. Todavía no representan trabajos realizados.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={catalog.tenants}
          tenantId={catalog.tenantId}
          onChange={catalog.selectTenant}
        />
        <p className="mt-3 text-xs text-slate-500">
          Cada empresa posee su propio catálogo aunque los nombres sean
          similares.
        </p>
      </div>

      <div className="mt-5">
        {catalog.isLoading ? (
          <div className="grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white">
            <LoaderCircle className="size-7 animate-spin text-slate-500" />
          </div>
        ) : null}
        {catalog.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5" /> {catalog.error}
            </div>
            <Button variant="outline" className="mt-3" onClick={catalog.retry}>
              Reintentar
            </Button>
          </div>
        ) : null}
        {!catalog.isLoading && !catalog.error ? (
          <CatalogList
            items={catalog.workTypes}
            emptyMessage="Esta empresa no tiene tipos de trabajo configurados."
          />
        ) : null}
      </div>
    </section>
  );
}
