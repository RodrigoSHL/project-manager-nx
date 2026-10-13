import { useEffect, useId, useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { LoadState } from '../models';
import { AnalyticsIcon, type AnalyticsIconTone } from './analytics-icon';

export function DashboardSection<T>({
  title,
  icon,
  tone,
  state,
  isEmpty,
  children,
  className = '',
}: {
  title: string;
  icon?: LucideIcon;
  tone?: AnalyticsIconTone;
  state: LoadState<T>;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(min-width: 768px)').matches)
  );
  const contentId = useId();
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)');
    if (!media) return;
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 ${className}`}
      aria-label={title}
    >
      <h2 className="hidden items-center gap-3 text-lg font-semibold text-slate-950 md:flex">
        {icon && <AnalyticsIcon icon={icon} tone={tone} />}
        <span className="min-w-0">{title}</span>
      </h2>
      <h2 className="md:hidden">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
        >
          {icon && <AnalyticsIcon icon={icon} tone={tone} />}
          <span className="min-w-0 flex-1">
            {title}
            {state.error ? (
              <span className="mt-1 block text-xs font-normal text-red-700">
                No disponible
              </span>
            ) : state.loading ? (
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Cargando…
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </h2>
      <div id={contentId} className={expanded ? 'block' : 'hidden md:block'}>
        {expanded || desktop ? (
          state.loading ? (
            <div role="status" className="mt-5 animate-pulse space-y-3">
              <div className="h-5 w-2/3 rounded bg-slate-100" />
              <div className="h-32 rounded bg-slate-100" />
              <span className="sr-only">Cargando {title}</span>
            </div>
          ) : state.error ? (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {state.error}
            </p>
          ) : state.data === null || isEmpty(state.data) ? (
            <p className="mt-5 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No hay información para el período seleccionado.
            </p>
          ) : (
            <div className="mt-5">{children(state.data)}</div>
          )
        ) : null}
      </div>
    </section>
  );
}
