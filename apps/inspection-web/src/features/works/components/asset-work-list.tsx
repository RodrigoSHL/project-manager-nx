import { CalendarDays, ChevronRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../assets/models';
import { formatWorkDate } from '../work-formatters';
import { useWorkCatalog } from '../use-work-catalog';
import { WorkStatusBadge } from './work-status-badge';

export function AssetWorkList({ asset }: { asset: Asset }) {
  const { works, catalog, isLoading } = useWorkCatalog(asset.tenantId);
  const assetWorks = works
    .filter((work) => work.assetId === asset.id && work.siteId === asset.siteId)
    .sort((a, b) => b.executionDate.localeCompare(a.executionDate));

  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900">Trabajos</h3>
      </div>
      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Cargando trabajos...</p>
      ) : assetWorks.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          Este activo todavía no tiene trabajos.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {assetWorks.map((work) => {
            const workType = catalog?.workTypes.find(
              (item) => item.id === work.workTypeId
            );
            return (
              <Link
                key={work.id}
                to={`/works/${work.id}?tenantId=${work.tenantId}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {workType?.name ?? work.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {formatWorkDate(work.executionDate)}
                    </span>
                    <span>{work.responsible}</span>
                  </p>
                </div>
                <WorkStatusBadge status={work.status} />
                <ChevronRight className="size-4 shrink-0 text-slate-400" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
