import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  AnalyticsConcept,
  FindingsByAsset,
  FindingsByAssetType,
} from '../models';

export function TopAssetsByFindings({
  rows,
  search,
}: {
  rows: FindingsByAsset[];
  search: string;
}) {
  return (
    <ol className="space-y-2">
      {rows.slice(0, 10).map((row, index) => (
        <li key={row.assetId}>
          <Link
            to={`/assets/${encodeURIComponent(row.assetId)}/history${search}`}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-500"
          >
            <span className="w-5 shrink-0 text-xs font-semibold text-slate-400">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {row.assetName}
            </span>
            <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              {row.count}
            </span>
            <ArrowUpRight className="size-4 text-slate-400" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function FindingsByAssetTypeList({
  rows,
}: {
  rows: FindingsByAssetType[];
}) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.assetTypeId ?? 'none'}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="truncate text-slate-700 dark:text-slate-200">{row.assetTypeName}</span>
          <strong className="text-slate-950 dark:text-slate-100">{row.count}</strong>
        </li>
      ))}
    </ul>
  );
}

export function AvailableConcepts({
  rows,
  search,
}: {
  rows: AnalyticsConcept[];
  search: string;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.slice(0, 6).map((row) => {
        const params = new URLSearchParams(search);
        params.set('conceptId', row.id);
        return (
          <li key={row.id}>
            <Link
              to={`/analytics/measurements?${params.toString()}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-colors hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-500"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {row.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {row.measurementCount.toLocaleString('es-CL')} mediciones
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-slate-400" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
