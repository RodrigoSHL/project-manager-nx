import { useState } from 'react';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { listWorkTypesByTenant } from '../features/work-types/work-type-selectors';
import { mockCatalogTenants } from '../mocks/asset-work-type-catalog';

export function AdminWorkTypesPage() {
  const [tenantId, setTenantId] = useState(mockCatalogTenants[0]?.id ?? '');
  const workTypes = listWorkTypesByTenant(tenantId);

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Tipos de trabajo</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Clases de trabajo que pueden habilitarse para tipos de activo o equipos
        concretos. Todavía no representan trabajos realizados.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={mockCatalogTenants}
          tenantId={tenantId}
          onChange={setTenantId}
        />
        <p className="mt-3 text-xs text-slate-500">
          Cada empresa posee su propio catálogo aunque los nombres sean
          similares.
        </p>
      </div>

      <div className="mt-5">
        <CatalogList
          items={workTypes}
          emptyMessage="Esta empresa no tiene tipos de trabajo configurados."
        />
      </div>
    </section>
  );
}
