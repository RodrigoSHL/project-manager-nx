import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { getRootAssetIds } from '../features/assets/asset-selectors';
import { AssetDetail } from '../features/assets/components/asset-detail';
import { AssetTree } from '../features/assets/components/asset-tree';
import { formatSiteType } from '../features/assets/asset-formatters';
import { useAssetCatalog } from '../features/assets/use-asset-catalog';

export function AssetsPage() {
  const catalog = useAssetCatalog();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tenant = catalog.tenants.find((item) => item.id === catalog.tenantId);
  const site = catalog.sites.find((item) => item.id === catalog.siteId);
  const assets = catalog.assets;
  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const parentAsset = selectedAsset?.parentId
    ? assets.find((asset) => asset.id === selectedAsset.parentId) ?? null
    : null;

  useEffect(() => {
    setSelectedAssetId(null);
    setSearchQuery('');
    setExpandedIds(new Set(getRootAssetIds(assets)));
  }, [assets]);

  function handleTenantChange(nextTenantId: string) {
    catalog.selectTenant(nextTenantId);
  }

  function handleSiteChange(nextSiteId: string) {
    catalog.selectSite(nextSiteId);
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
              value={catalog.tenantId}
              onChange={(event) => handleTenantChange(event.target.value)}
              disabled={catalog.tenants.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {catalog.tenants.length === 0 ? (
                <option value="">Cargando empresas...</option>
              ) : null}
              {catalog.tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mina / Faena / Sitio
            <select
              value={catalog.siteId}
              onChange={(event) => handleSiteChange(event.target.value)}
              disabled={catalog.sites.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {catalog.sites.length === 0 ? (
                <option value="">Cargando ubicaciones...</option>
              ) : null}
              {catalog.sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {tenant && site ? (
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
        ) : null}
      </section>

      {catalog.error ? (
        <section className="mt-6 flex flex-col items-center rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="size-8 text-red-500" />
          <h2 className="mt-3 font-semibold text-slate-900">
            No pudimos cargar los activos
          </h2>
          <p className="mt-1 text-sm text-slate-500">{catalog.error}</p>
          <Button className="mt-4" onClick={catalog.retry}>
            Reintentar
          </Button>
        </section>
      ) : null}

      {catalog.isLoading && assets.length === 0 ? (
        <section className="mt-6 grid min-h-64 place-items-center rounded-xl border border-slate-200 bg-white text-center shadow-sm">
          <div>
            <LoaderCircle className="mx-auto size-8 animate-spin text-slate-500" />
            <p className="mt-3 text-sm text-slate-600">Cargando catálogo...</p>
          </div>
        </section>
      ) : null}

      {!catalog.error && tenant && site && assets.length > 0 ? (
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
                <span className="sr-only">
                  Buscar activo por nombre o código
                </span>
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
                assetTypes={catalog.assetTypes}
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
            assetTypes={catalog.assetTypes}
          />
        </div>
      ) : null}
    </>
  );
}
