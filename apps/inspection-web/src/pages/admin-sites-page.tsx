import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Factory,
  LoaderCircle,
  MapPinned,
  Mountain,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
} from 'lucide-react';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import { formatSiteType } from '../features/assets/asset-formatters';
import type { Site } from '../features/assets/models';
import { SiteAdminForm } from '../features/sites/components/site-admin-form';
import type { SiteAdminFormValue } from '../features/sites/site-admin-schema';
import { useSiteAdministration } from '../features/sites/use-site-administration';

const siteIcons = {
  MINE: Mountain,
  PLANT: Factory,
  SITE: MapPinned,
} satisfies Record<Site['type'], typeof MapPinned>;

export function AdminSitesPage() {
  const administration = useSiteAdministration();
  const [editing, setEditing] = useState<Site | null | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEditing(undefined);
    setSearchQuery('');
  }, [administration.tenantId]);

  const filteredSites = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    if (!query) return administration.sites;
    return administration.sites.filter(
      (site) =>
        site.name.toLocaleLowerCase('es').includes(query) ||
        site.code.toLocaleLowerCase('es').includes(query) ||
        formatSiteType(site.type).toLocaleLowerCase('es').includes(query)
    );
  }, [administration.sites, searchQuery]);

  async function save(value: SiteAdminFormValue) {
    if (editing) await administration.updateSite(editing.id, value);
    else await administration.createSite(value);
    setEditing(undefined);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Sitios y faenas
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Crea las minas, plantas o sitios que organizan las subestaciones de
            cada empresa.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setEditing(null)}
          disabled={!administration.tenantId}
        >
          <Plus /> Nueva ubicación
        </Button>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={administration.tenants}
          tenantId={administration.tenantId}
          onChange={administration.selectTenant}
        />
        <p className="mt-3 text-xs text-slate-500">
          Cada ubicación se guarda con el tenant seleccionado y no se comparte
          con otras empresas.
        </p>
      </div>

      {administration.error || administration.mutationError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            {administration.mutationError ?? administration.error}
          </div>
          {administration.error ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={administration.retry}
            >
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}

      {editing !== undefined ? (
        <div className="mt-5">
          <SiteAdminForm
            site={editing}
            isSubmitting={administration.isMutating}
            onCancel={() => setEditing(undefined)}
            onSubmit={save}
          />
        </div>
      ) : null}

      {administration.isLoading ? (
        <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white">
          <LoaderCircle className="size-7 animate-spin text-slate-500" />
        </div>
      ) : null}

      {!administration.isLoading && !administration.error ? (
        <section className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Ubicaciones de la empresa
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {administration.sites.length} configuradas ·{' '}
                  {administration.sites.filter((site) => site.active).length}{' '}
                  activas
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {filteredSites.length} visibles
              </span>
            </div>

            <label className="relative mt-3 block max-w-xl">
              <span className="sr-only">Buscar ubicaciones</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, código o tipo..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          {filteredSites.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <MapPinned className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">
                  {searchQuery
                    ? 'No encontramos ubicaciones'
                    : 'Este tenant todavía no tiene ubicaciones'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery
                    ? 'Prueba con otro nombre, código o tipo.'
                    : 'Crea una mina, planta o faena para comenzar a organizar sus activos.'}
                </p>
                {!searchQuery ? (
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => setEditing(null)}
                    disabled={!administration.tenantId}
                  >
                    <Plus /> Crear primera ubicación
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSites.map((site) => {
                const Icon = siteIcons[site.type];
                return (
                  <article
                    key={site.id}
                    className="min-w-0 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="max-w-full truncate rounded bg-slate-100 px-2 py-1 font-mono text-[0.7rem] font-semibold text-slate-600">
                            {site.code}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[0.7rem] font-medium ${
                              site.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {site.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <h3
                          className="mt-3 truncate font-semibold text-slate-950"
                          title={site.name}
                        >
                          {site.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatSiteType(site.type)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        aria-label={`Editar ${site.name}`}
                        title="Editar"
                        onClick={() => setEditing(site)}
                        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={administration.isMutating}
                        aria-label={`${
                          site.active ? 'Desactivar' : 'Activar'
                        } ${site.name}`}
                        title={site.active ? 'Desactivar' : 'Activar'}
                        onClick={() =>
                          void administration.updateSite(site.id, {
                            active: !site.active,
                          })
                        }
                        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {site.active ? (
                          <Power className="size-4" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
