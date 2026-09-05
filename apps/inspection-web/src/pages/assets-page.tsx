import { useMemo, useState } from 'react';
import { Building2, ChevronRight, MapPin, Search } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import {
  getAssetsForContext,
  getRootAssetIds,
  getSitesForTenant,
} from '../features/assets/asset-selectors';
import { AssetDetail } from '../features/assets/components/asset-detail';
import { AssetTree } from '../features/assets/components/asset-tree';
import { formatSiteType } from '../features/assets/asset-formatters';
import {
  mockAssets,
  mockSites,
  mockTenants,
} from '../features/assets/mock-data';

export function AssetsPage() {
  const [tenantId, setTenantId] = useState(mockTenants[0].id);
  const initialSites = getSitesForTenant(mockSites, mockTenants[0].id);
  const [siteId, setSiteId] = useState(initialSites[0].id);
  const initialAssets = getAssetsForContext(mockAssets, tenantId, siteId);
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(getRootAssetIds(initialAssets))
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tenant =
    mockTenants.find((item) => item.id === tenantId) ?? mockTenants[0];
  const sites = useMemo(
    () => getSitesForTenant(mockSites, tenantId),
    [tenantId]
  );
  const site = sites.find((item) => item.id === siteId) ?? sites[0];

  // Este es el límite multi-tenant de la pantalla: el árbol recibe solamente
  // activos que coinciden con el tenant y el sitio seleccionados.
  const assets = useMemo(
    () => getAssetsForContext(mockAssets, tenant.id, site.id),
    [tenant.id, site.id]
  );
  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const parentAsset = selectedAsset?.parentId
    ? assets.find((asset) => asset.id === selectedAsset.parentId) ?? null
    : null;

  function resetAssetView(nextTenantId: string, nextSiteId: string) {
    const nextAssets = getAssetsForContext(
      mockAssets,
      nextTenantId,
      nextSiteId
    );
    setSelectedAssetId(null);
    setSearchQuery('');
    setExpandedIds(new Set(getRootAssetIds(nextAssets)));
  }

  function handleTenantChange(nextTenantId: string) {
    const nextSites = getSitesForTenant(mockSites, nextTenantId);
    const nextSiteId = nextSites[0].id;
    setTenantId(nextTenantId);
    setSiteId(nextSiteId);
    resetAssetView(nextTenantId, nextSiteId);
  }

  function handleSiteChange(nextSiteId: string) {
    setSiteId(nextSiteId);
    resetAssetView(tenantId, nextSiteId);
  }

  function toggleAsset(assetId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Activos"
        description="Explora la organización desde la empresa y la faena hasta cada activo de una subestación."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Tenant / Empresa
            <select
              value={tenantId}
              onChange={(event) => handleTenantChange(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {mockTenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mina / Faena / Sitio
            <select
              value={site.id}
              onChange={(event) => handleSiteChange(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Building2 className="size-4" /> {tenant.name}
          </span>
          <ChevronRight className="size-4 text-slate-400" />
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {formatSiteType(site.type)}:{' '}
            {site.name}
          </span>
          <ChevronRight className="size-4 text-slate-400" />
          <span>Subestaciones y activos</span>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Árbol de activos
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {assets.length} activos dentro de {site.name}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {getRootAssetIds(assets).length} subestaciones
              </span>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Buscar activo por nombre o código</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre o código..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="max-h-[38rem] overflow-auto p-2 md:p-3">
            <AssetTree
              assets={assets}
              expandedIds={expandedIds}
              selectedAssetId={selectedAssetId}
              searchQuery={searchQuery}
              onToggle={toggleAsset}
              onSelect={setSelectedAssetId}
            />
          </div>
        </section>

        <AssetDetail
          asset={selectedAsset}
          parent={parentAsset}
          tenant={tenant}
          site={site}
        />
      </div>
    </>
  );
}
