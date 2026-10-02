import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  FileText,
  LoaderCircle,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { WorkStatusBadge } from '../features/works/components/work-status-badge';
import { formatWorkDate } from '../features/works/work-formatters';
import { useWorkCatalog } from '../features/works/use-work-catalog';
import { ReportSettingsPanel } from '../features/works/components/report-settings-panel';

export function AdminReportsPage() {
  const { administrableTenants } = useTenantAccess();
  const [tenantId, setTenantId] = useState('');
  const [search, setSearch] = useState('');
  const catalog = useWorkCatalog(tenantId);

  useEffect(() => {
    setTenantId((current) =>
      administrableTenants.some((tenant) => tenant.id === current)
        ? current
        : administrableTenants[0]?.id ?? ''
    );
  }, [administrableTenants]);

  const works = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return catalog.works
      .filter((work) => {
        if (!query) return true;
        const asset = catalog.catalog?.assets.find(
          (item) => item.id === work.assetId
        );
        const workType = catalog.catalog?.workTypes.find(
          (item) => item.id === work.workTypeId
        );
        return [
          work.title,
          work.responsible,
          asset?.name,
          asset?.code,
          workType?.name,
        ]
          .filter(Boolean)
          .some((value) => value?.toLocaleLowerCase('es').includes(query));
      })
      .sort((a, b) => b.executionDate.localeCompare(a.executionDate));
  }, [catalog.works, catalog.catalog, search]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Informes</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Revisa las vistas previas y las versiones guardadas de los trabajos de
        cada empresa que administras.
      </p>

      <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <CatalogTenantSelector
          tenants={administrableTenants}
          tenantId={tenantId}
          onChange={setTenantId}
        />
        <label className="block text-sm font-medium text-slate-700">
          Buscar trabajo
          <span className="relative mt-2 block">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Título, activo, tipo o responsable"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </span>
        </label>
      </div>

      {tenantId ? (
        <ReportSettingsPanel key={tenantId} tenantId={tenantId} />
      ) : null}

      {catalog.error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            {catalog.error}
          </div>
          <Button variant="outline" className="mt-3" onClick={catalog.retry}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {catalog.isLoading && !catalog.catalog ? (
        <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white">
          <LoaderCircle className="size-7 animate-spin text-slate-500" />
        </div>
      ) : null}

      {!catalog.isLoading &&
      !catalog.error &&
      tenantId &&
      works.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileText className="mx-auto size-8 text-slate-400" />
          <p className="mt-3 font-medium text-slate-900">
            No hay trabajos para esta búsqueda
          </p>
        </div>
      ) : null}

      {works.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {works.map((work) => {
            const asset = catalog.catalog?.assets.find(
              (item) => item.id === work.assetId
            );
            const workType = catalog.catalog?.workTypes.find(
              (item) => item.id === work.workTypeId
            );
            return (
              <Link
                key={work.id}
                to={`/works/${work.id}/report?tenantId=${encodeURIComponent(
                  tenantId
                )}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {workType?.name ?? 'Trabajo'}
                      </span>
                      <span className="mt-1 block font-semibold text-slate-950">
                        {work.title}
                      </span>
                    </span>
                    <WorkStatusBadge status={work.status} />
                  </span>
                  <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    <span>
                      {asset
                        ? `${asset.code} · ${asset.name}`
                        : 'Activo no disponible'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-slate-400" />
                      {formatWorkDate(work.executionDate)}
                    </span>
                    <span>{work.responsible}</span>
                  </span>
                  <span className="mt-3 block text-sm font-medium text-slate-800">
                    {work.status === 'FINISHED' || work.status === 'REVIEWED'
                      ? 'Revisar informe'
                      : 'Ver vista previa'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
