import type { ReactNode } from 'react';
import type { LoadState } from '../models';

export function DashboardSection<T>({
  title,
  state,
  isEmpty,
  children,
  className = '',
}: {
  title: string;
  state: LoadState<T>;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      aria-label={title}
    >
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {state.loading ? (
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
      )}
    </section>
  );
}
