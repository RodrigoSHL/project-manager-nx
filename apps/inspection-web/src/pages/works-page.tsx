import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  LoaderCircle,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { useAssetCatalog } from '../features/assets/use-asset-catalog';
import { WorkStatusBadge } from '../features/works/components/work-status-badge';
import { formatWorkDate } from '../features/works/work-formatters';
import {
  WorkListFilters,
  emptyWorkFilters,
  type WorkListFilterValues,
} from '../features/works/components/work-list-filters';
import { useWorkCatalog } from '../features/works/use-work-catalog';
import { SyncStatusBadge } from '../features/offline/components/sync-status-badge';
import { OfflineContentUnavailable } from '../features/offline/components/offline-content-unavailable';
import { useOffline } from '../features/offline/offline-context';

export function WorksPage() {
  const { mode } = useOffline();
  const organization = useAssetCatalog();
  const catalog = useWorkCatalog(organization.tenantId);
  const [filters, setFilters] = useState(emptyWorkFilters);
  const { siteId, assetId, workTypeId, status } = filters;

  useEffect(() => {
    setFilters(emptyWorkFilters);
  }, [organization.tenantId]);

  const references = catalog.catalog;
  function applyFilters(next: WorkListFilterValues) {
    if (next.tenantId !== organization.tenantId) {
      organization.selectTenant(next.tenantId);
      setFilters(emptyWorkFilters);
    } else {
      setFilters({
        siteId: next.siteId,
        assetId: next.assetId,
        workTypeId: next.workTypeId,
        status: next.status,
      });
    }
  }
  const filteredWorks = useMemo(
    () =>
      catalog.works
        .filter((work) => !siteId || work.siteId === siteId)
        .filter((work) => !assetId || work.assetId === assetId)
        .filter((work) => !workTypeId || work.workTypeId === workTypeId)
        .filter((work) => !status || work.status === status)
        .sort((a, b) => b.executionDate.localeCompare(a.executionDate)),
    [assetId, catalog.works, siteId, status, workTypeId]
  );
  const localContentUnavailable =
    mode === 'LOCAL' &&
    !catalog.isLoading &&
    (!organization.tenantId ||
      !references ||
      references.sites.length === 0 ||
      references.assets.length === 0);

  return (
    <>
      <PageHeader
        title="Trabajos"
        description="Consulta tus inspecciones y continúa el trabajo en terreno."
      />
      <WorkListFilters
        values={{ tenantId: organization.tenantId, ...filters }}
        tenants={organization.tenants}
        sites={references?.sites ?? []}
        assets={references?.assets ?? []}
        workTypes={references?.workTypes ?? []}
        loading={catalog.isLoading}
        onChange={applyFilters}
      />

      {catalog.error ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto size-7 text-red-500" />
          <p className="mt-3 text-sm text-red-700">{catalog.error}</p>
          <Button className="mt-4" onClick={catalog.retry}>
            Reintentar
          </Button>
        </section>
      ) : null}
      {catalog.isLoading && !references ? (
        <section className="mt-6 grid min-h-64 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <LoaderCircle className="mx-auto size-8 animate-spin text-slate-500" />
            <p className="mt-3 text-sm text-slate-600">
              Cargando trabajos locales...
            </p>
          </div>
        </section>
      ) : null}
      {localContentUnavailable ? (
        <OfflineContentUnavailable subject="El catálogo de trabajos" />
      ) : null}
      {!localContentUnavailable &&
      !catalog.isLoading &&
      references &&
      filteredWorks.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ClipboardList className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">
            No hay trabajos para estos filtros
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecciona un activo y usa “Nuevo trabajo” para crear uno.
          </p>
        </section>
      ) : null}
      {filteredWorks.length > 0 ? (
        <section className="mt-6 grid gap-3">
          {filteredWorks.map((work) => {
            const asset = references?.assets.find(
              (item) => item.id === work.assetId
            );
            const site = references?.sites.find(
              (item) => item.id === work.siteId
            );
            const workType = references?.workTypes.find(
              (item) => item.id === work.workTypeId
            );
            return (
              <Link
                key={work.id}
                to={`/works/${work.id}?tenantId=${work.tenantId}`}
                className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow md:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                    <ClipboardList className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {workType?.name}
                        </p>
                        <h2 className="mt-1 font-semibold text-slate-950">
                          {work.title}
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <WorkStatusBadge status={work.status} />
                        <SyncStatusBadge work={work} />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                      <span>
                        {asset
                          ? `${asset.code} · ${asset.name}`
                          : 'Activo no disponible'}
                      </span>
                      <span>{site?.name ?? 'Sitio no disponible'}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4 text-slate-400" />
                        {formatWorkDate(work.executionDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="size-4 text-slate-400" />
                        {work.responsible}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 size-5 shrink-0 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </section>
      ) : null}
    </>
  );
}
