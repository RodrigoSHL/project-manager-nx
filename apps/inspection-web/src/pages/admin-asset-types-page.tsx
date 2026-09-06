import { useState } from 'react';
import { CatalogList } from '../components/catalog-list';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { listAssetTypesByTenant } from '../features/asset-types/asset-type-selectors';
import { mockCatalogTenants } from '../mocks/asset-work-type-catalog';

export function AdminAssetTypesPage() {
  const [tenantId, setTenantId] = useState(mockCatalogTenants[0]?.id ?? '');
  const assetTypes = listAssetTypesByTenant(tenantId);

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Tipos de activos</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Catálogo local que clasifica los equipos de cada empresa. En esta etapa
        es solo de lectura.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={mockCatalogTenants}
          tenantId={tenantId}
          onChange={setTenantId}
        />
        <p className="mt-3 text-xs text-slate-500">
          Se muestran únicamente tipos cuyo tenantId coincide con la empresa
          seleccionada.
        </p>
      </div>

      <div className="mt-5">
        <CatalogList
          items={assetTypes}
          emptyMessage="Esta empresa no tiene tipos de activos configurados."
        />
      </div>
    </section>
  );
}
