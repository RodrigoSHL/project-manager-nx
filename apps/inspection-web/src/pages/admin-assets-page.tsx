import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Box,
  Building2,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  GitBranch,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  findAssetType,
  isSubstationAsset,
  listAssetTypesByTenant,
} from '../features/asset-types/asset-type-selectors';
import type { AssetAdminForm as AssetAdminFormValues } from '../features/assets/asset-admin-schema';
import {
  formatAssetStatus,
  formatSiteType,
} from '../features/assets/asset-formatters';
import { AssetAdminForm } from '../features/assets/components/asset-admin-form';
import { AssetTree } from '../features/assets/components/asset-tree';
import type { Asset } from '../features/assets/models';
import { useAssetAdministration } from '../features/assets/use-asset-administration';
import { AvailableWorkTypes } from '../features/work-types/components/available-work-types';

type EditorMode = 'detail' | 'create-root' | 'create-child' | 'edit';

const statusClasses: Record<Asset['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  OUT_OF_SERVICE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function AdminAssetsPage() {
  const admin = useAssetAdministration();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('detail');

  useEffect(() => {
    setSelectedAssetId(null);
    setExpandedIds(new Set());
    setSearchQuery('');
    setEditorMode('detail');
  }, [admin.tenantId, admin.siteId]);

  useEffect(() => {
    const rootIds = admin.assets
      .filter((asset) => asset.parentId === null)
      .map((asset) => asset.id);

    setSelectedAssetId((current) =>
      current && admin.assets.some((asset) => asset.id === current)
        ? current
        : rootIds[0] ?? null
    );
    setExpandedIds((current) => {
      const next = new Set(current);
      rootIds.forEach((id) => next.add(id));
      return next;
    });
  }, [admin.assets]);

  const tenant = admin.tenants.find((item) => item.id === admin.tenantId);
  const site = admin.sites.find((item) => item.id === admin.siteId);
  const selectedAsset = admin.assets.find(
    (asset) => asset.id === selectedAssetId
  );
  const assetTypes = useMemo(
    () => listAssetTypesByTenant(admin.tenantId),
    [admin.tenantId]
  );
  const selectedAssetType = selectedAsset
    ? findAssetType(selectedAsset.tenantId, selectedAsset.assetTypeId)
    : undefined;
  const assetsById = useMemo(
    () => new Map(admin.assets.map((asset) => [asset.id, asset])),
    [admin.assets]
  );
  const childCount = selectedAsset
    ? admin.assets.filter((asset) => asset.parentId === selectedAsset.id).length
    : 0;
  const selectedPath = useMemo(() => {
    if (!selectedAsset) return [];
    const path: Asset[] = [];
    const visited = new Set<string>();
    let current: Asset | undefined = selectedAsset;

    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.parentId ? assetsById.get(current.parentId) : undefined;
    }
    return path;
  }, [assetsById, selectedAsset]);

  function toggleAsset(assetId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  function selectAsset(assetId: string) {
    setSelectedAssetId(assetId);
    setEditorMode('detail');
  }

  async function saveAsset(values: AssetAdminFormValues) {
    if (editorMode === 'edit' && selectedAsset) {
      await admin.updateAsset(selectedAsset.id, values);
    } else {
      const createdAsset = await admin.createAsset(values);
      if (createdAsset) {
        setSelectedAssetId(createdAsset.id);
        if (createdAsset.parentId) {
          setExpandedIds((current) =>
            new Set(current).add(createdAsset.parentId as string)
          );
        }
      }
    }
    setEditorMode('detail');
  }

  async function removeSelectedAsset() {
    if (!selectedAsset || childCount > 0) return;
    if (
      !window.confirm(
        `¿Eliminar el activo ${selectedAsset.code}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    const parentId = selectedAsset.parentId;
    try {
      await admin.deleteAsset(selectedAsset.id);
      setSelectedAssetId(parentId);
      setEditorMode('detail');
    } catch {
      // The mutation hook exposes the server error above the workspace.
    }
  }

  const roots = admin.assets.filter((asset) => asset.parentId === null);

  return (
    <>
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-slate-950">Activos</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Organiza las subestaciones y sus componentes directamente desde el
          árbol del sitio.
        </p>
      </header>

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
            onClick={() => setEditorMode('create-root')}
            disabled={!tenant || !site || admin.isLoading}
          >
            <Plus /> Nueva subestación
          </Button>
        </div>

        {tenant && site ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Building2 className="size-4" /> {tenant.name}
            </span>
            <ChevronRight className="size-4 text-slate-400" />
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" /> {formatSiteType(site.type)} ·{' '}
              {site.name}
            </span>
            <ChevronRight className="size-4 text-slate-400" />
            <span>
              {roots.length} subestaciones · {admin.assets.length} activos
            </span>
          </div>
        ) : null}
      </section>

      {admin.error || admin.mutationError ? (
        <section className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p>{admin.mutationError ?? admin.error}</p>
        </section>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">
                  Árbol del sitio
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Selecciona un nodo para administrarlo.
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Expandir todo"
                  title="Expandir todo"
                  onClick={() =>
                    setExpandedIds(
                      new Set(admin.assets.map((asset) => asset.id))
                    )
                  }
                >
                  <ChevronsDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Colapsar todo"
                  title="Colapsar todo"
                  onClick={() => setExpandedIds(new Set())}
                >
                  <ChevronsUp />
                </Button>
              </div>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Buscar activos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por código o nombre..."
                className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="max-h-[42rem] overflow-auto p-2 md:p-3">
            {admin.isLoading && admin.assets.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto size-8 animate-spin text-slate-500" />
                  <p className="mt-3 text-sm text-slate-600">
                    Cargando activos...
                  </p>
                </div>
              </div>
            ) : (
              <AssetTree
                assets={admin.assets}
                expandedIds={expandedIds}
                selectedAssetId={selectedAssetId}
                searchQuery={searchQuery}
                onToggle={toggleAsset}
                onSelect={selectAsset}
              />
            )}
          </div>
        </section>

        <div className="lg:sticky lg:top-24">
          {editorMode !== 'detail' ? (
            <AssetAdminForm
              asset={editorMode === 'edit' ? selectedAsset ?? null : null}
              assets={admin.assets}
              assetTypes={assetTypes}
              initialParentId={
                editorMode === 'create-child' ? selectedAssetId : null
              }
              isSubmitting={admin.isMutating}
              onCancel={() => setEditorMode('detail')}
              onSubmit={saveAsset}
            />
          ) : selectedAsset ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                    isSubstationAsset(selectedAsset)
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isSubstationAsset(selectedAsset) ? (
                    <Building2 className="size-6" />
                  ) : (
                    <Box className="size-6" />
                  )}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    statusClasses[selectedAsset.status]
                  }`}
                >
                  {formatAssetStatus(selectedAsset.status)}
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {selectedAsset.code}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {selectedAsset.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedAssetType?.name ?? 'Tipo de activo no disponible'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <GitBranch className="mr-1 size-4 shrink-0" />
                {selectedPath.map((asset, index) => (
                  <span
                    key={asset.id}
                    className="inline-flex items-center gap-1.5"
                  >
                    {index > 0 ? (
                      <ChevronRight className="size-3 text-slate-400" />
                    ) : null}
                    <span
                      className={
                        asset.id === selectedAsset.id
                          ? 'font-semibold text-slate-900'
                          : undefined
                      }
                    >
                      {asset.code}
                    </span>
                  </span>
                ))}
              </div>

              <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                <div className="grid grid-cols-[8rem_1fr] gap-3 py-3">
                  <dt className="text-slate-500">Activo padre</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAsset.parentId
                      ? assetsById.get(selectedAsset.parentId)?.name ??
                        'No disponible'
                      : 'Nodo raíz'}
                  </dd>
                </div>
                <div className="grid grid-cols-[8rem_1fr] gap-3 py-3">
                  <dt className="text-slate-500">Hijos directos</dt>
                  <dd className="font-medium text-slate-800">{childCount}</dd>
                </div>
                <div className="grid grid-cols-[8rem_1fr] gap-3 py-3">
                  <dt className="text-slate-500">Ubicación</dt>
                  <dd className="font-medium text-slate-800">
                    {site?.name ?? 'No disponible'}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                {selectedAsset.description ??
                  'Este activo todavía no tiene una descripción.'}
              </p>

              <AvailableWorkTypes asset={selectedAsset} />

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => setEditorMode('create-child')}
                >
                  <Plus /> Agregar hijo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditorMode('edit')}
                >
                  <Pencil /> Editar activo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-50 sm:col-span-2"
                  onClick={() => void removeSelectedAsset()}
                  disabled={admin.isMutating || childCount > 0}
                  title={
                    childCount > 0
                      ? 'Elimina o mueve primero los activos hijos'
                      : 'Eliminar activo'
                  }
                >
                  <Trash2 />
                  {childCount > 0
                    ? `No se puede eliminar · ${childCount} hijos`
                    : 'Eliminar activo'}
                </Button>
              </div>
            </section>
          ) : (
            <section className="grid min-h-96 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-600">
                  <GitBranch className="size-6" />
                </span>
                <h2 className="mt-4 font-semibold text-slate-900">
                  Selecciona un activo
                </h2>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  El detalle y las acciones aparecerán aquí.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
