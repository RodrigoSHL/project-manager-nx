import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  to,
  loading,
  error,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
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
        <span
          className="hidden size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 md:grid"
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
      </div>
      {loading ? (
        <div
          role="status"
          className="mt-4 h-9 w-20 animate-pulse rounded bg-slate-100"
        >
          <span className="sr-only">Cargando {label}</span>
        </div>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 md:mt-3 md:text-3xl">
          {value}
        </p>
      )}
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
