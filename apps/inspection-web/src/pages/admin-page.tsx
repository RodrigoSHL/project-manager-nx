import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/page-header';
import { AssetAdminForm } from '../features/assets/components/asset-admin-form';
import {
  formatAssetStatus,
  formatAssetType,
  formatSiteType,
} from '../features/assets/asset-formatters';
import type { Asset } from '../features/assets/models';
import { useAssetAdministration } from '../features/assets/use-asset-administration';
import type { AssetAdminForm as AssetAdminFormValues } from '../features/assets/asset-admin-schema';

const statusClasses: Record<Asset['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  OUT_OF_SERVICE: 'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
};

export function AdminPage() {
  const admin = useAssetAdministration();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEditingAsset(null);
    setIsFormOpen(false);
    setSearchQuery('');
  }, [admin.tenantId, admin.siteId]);

  const tenant = admin.tenants.find((item) => item.id === admin.tenantId);
  const site = admin.sites.find((item) => item.id === admin.siteId);
  const parentById = useMemo(
    () => new Map(admin.assets.map((asset) => [asset.id, asset])),
    [admin.assets]
  );
  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return admin.assets;
    return admin.assets.filter(
      (asset) =>
        asset.code.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.type.toLowerCase().includes(query)
    );
  }, [admin.assets, searchQuery]);

  function openCreateForm() {
    setEditingAsset(null);
    setIsFormOpen(true);
  }

  function openEditForm(asset: Asset) {
    setEditingAsset(asset);
    setIsFormOpen(true);
  }

  async function saveAsset(values: AssetAdminFormValues) {
    if (editingAsset) {
      await admin.updateAsset(editingAsset.id, values);
    } else {
      await admin.createAsset(values);
    }
    setEditingAsset(null);
    setIsFormOpen(false);
  }

  async function removeAsset(asset: Asset) {
    if (
      !window.confirm(
        `¿Eliminar el activo ${asset.code}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await admin.deleteAsset(asset.id);
      if (editingAsset?.id === asset.id) {
        setEditingAsset(null);
        setIsFormOpen(false);
      }
    } catch {
      // The mutation error is rendered below the selectors.
    }
  }

  return (
    <>
      <PageHeader
        title="Administración de activos"
        description="Crea, edita y organiza los activos de cada sitio sin mezclar información entre empresas."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">
            Tenant / Empresa
            <select
              value={admin.tenantId}
              onChange={(event) => admin.selectTenant(event.target.value)}
              disabled={admin.tenants.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {admin.tenants.length === 0 ? (
                <option value="">Cargando empresas...</option>
              ) : null}
              {admin.tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mina / Faena / Sitio
            <select
              value={admin.siteId}
              onChange={(event) => admin.selectSite(event.target.value)}
              disabled={admin.sites.length === 0}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {admin.sites.length === 0 ? (
                <option value="">Cargando ubicaciones...</option>
              ) : null}
              {admin.sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            onClick={openCreateForm}
            disabled={!tenant || !site || admin.isLoading}
          >
            <Plus /> Nuevo activo
          </Button>
        </div>

        {tenant && site ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Building2 className="size-4" /> {tenant.name}
            </span>
            <span className="text-slate-400">/</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" /> {formatSiteType(site.type)} ·{' '}
              {site.name}
            </span>
            <span className="text-slate-400">/</span>
            <span>{admin.assets.length} activos</span>
          </div>
        ) : null}
      </section>

      {admin.error || admin.mutationError ? (
        <section className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p>{admin.mutationError ?? admin.error}</p>
        </section>
      ) : null}

      {isFormOpen ? (
        <div className="mt-6">
          <AssetAdminForm
            asset={editingAsset}
            assets={admin.assets}
            isSubmitting={admin.isMutating}
            onCancel={() => {
              setEditingAsset(null);
              setIsFormOpen(false);
            }}
            onSubmit={saveAsset}
          />
        </div>
      ) : null}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-950">
                Catálogo de activos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Administra los nodos del sitio seleccionado.
              </p>
            </div>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Buscar activos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar código, nombre o tipo..."
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
        </div>

        {admin.isLoading && admin.assets.length === 0 ? (
          <div className="grid min-h-56 place-items-center p-8 text-center">
            <div>
              <LoaderCircle className="mx-auto size-8 animate-spin text-slate-500" />
              <p className="mt-3 text-sm text-slate-600">Cargando activos...</p>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-800">
              No hay activos para mostrar
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Crea el primer activo o cambia el texto de búsqueda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssets.map((asset) => {
              const parent = asset.parentId
                ? parentById.get(asset.parentId)
                : null;
              return (
                <article
                  key={asset.id}
                  className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {asset.code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          statusClasses[asset.status]
                        }`}
                      >
                        {formatAssetStatus(asset.status)}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate font-semibold text-slate-900">
                      {asset.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatAssetType(asset.type)} ·{' '}
                      {parent ? `Padre: ${parent.code}` : 'Nodo raíz'}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openEditForm(asset)}
                    >
                      <Pencil /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Eliminar ${asset.name}`}
                      onClick={() => void removeAsset(asset)}
                      disabled={admin.isMutating}
                    >
                      <Trash2 className="text-red-600" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
