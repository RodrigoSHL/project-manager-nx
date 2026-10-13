import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalyticsIcon, type AnalyticsIconTone } from './analytics-icon';

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
  to,
  loading,
  error,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: AnalyticsIconTone;
  to?: string;
  loading?: boolean;
  error?: string | null;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <p className="min-h-10 min-w-0 text-sm font-medium text-slate-600 md:min-h-0">
          {label}
        </p>
        <span className="hidden md:block">
          <AnalyticsIcon icon={icon} tone={tone} />
        </span>
      </div>
      <div className="mt-2 flex min-h-9 items-center justify-between gap-2 md:mt-3">
        {loading ? (
          <div
            role="status"
            className="h-9 w-20 animate-pulse rounded bg-slate-100"
          >
            <span className="sr-only">Cargando {label}</span>
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : (
          <p className="min-w-0 break-words text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            {value}
          </p>
        )}
        <span className="md:hidden">
          <AnalyticsIcon icon={icon} tone={tone} />
        </span>
      </div>
      {!loading && !error && (
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      )}
    </>
  );
  const className =
    'block min-w-0 break-words rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:min-h-36 md:p-5';
  return to && !loading && !error ? (
    <Link
      to={to}
      className={`${className} transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500`}
    >
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}
