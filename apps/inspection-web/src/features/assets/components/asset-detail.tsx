import { Box, Building2, MapPin } from 'lucide-react';
import {
  formatAssetStatus,
  formatAssetType,
  formatSiteType,
} from '../asset-formatters';
import type { Asset, Site, Tenant } from '../models';

type AssetDetailProps = {
  asset: Asset | null;
  parent: Asset | null;
  tenant: Tenant;
  site: Site;
};

const statusClasses: Record<Asset['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  OUT_OF_SERVICE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function AssetDetail({ asset, parent, tenant, site }: AssetDetailProps) {
  if (!asset) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
            <Box className="size-6" />
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">
            Selecciona un activo
          </h2>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            El detalle aparecerá aquí sin salir del árbol.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
          {asset.type === 'SUBSTATION' ? (
            <Building2 className="size-5" />
          ) : (
            <Box className="size-5" />
          )}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
            statusClasses[asset.status]
          }`}
        >
          {formatAssetStatus(asset.status)}
        </span>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {asset.code}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">
        {asset.name}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {formatAssetType(asset.type)}
      </p>

      <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100 text-sm">
        <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
          <dt className="text-slate-500">Empresa</dt>
          <dd className="font-medium text-slate-800">{tenant.name}</dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
          <dt className="text-slate-500">Ubicación</dt>
          <dd className="font-medium text-slate-800">{site.name}</dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
          <dt className="text-slate-500">Contenedor</dt>
          <dd className="text-slate-700">
            {formatSiteType(site.type)} · {site.code}
          </dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
          <dt className="text-slate-500">Activo padre</dt>
          <dd className="text-slate-700">
            {parent
              ? `${parent.name} · ${parent.code}`
              : 'Nodo superior del árbol'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex gap-3 rounded-lg bg-slate-50 p-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <p className="text-sm leading-6 text-slate-600">
          {asset.description ?? 'Este activo aún no tiene una descripción.'}
        </p>
      </div>
    </section>
  );
}
