import { Link } from 'react-router-dom';
import { useConnectivity } from '../../../hooks/use-connectivity';
import { useOffline } from '../offline-context';
import { connectionPresentation } from '../../connectivity/connectivity-presentation';
import { connectivityAppearances } from './connectivity-appearance';

export function ConnectivityStatus({ compact = false }: { compact?: boolean }) {
  const connectivity = useConnectivity();
  const { pendingSummary } = useOffline();
  const presentation = connectionPresentation(connectivity);
  const state = {
    ...presentation,
    ...connectivityAppearances[presentation.status],
  };
  const detail =
    pendingSummary.total > 0
      ? `${pendingSummary.total} cambios pendientes en este dispositivo`
      : state.detail;
  const content = (
    <span
      className={`inline-flex min-w-0 max-w-full items-center rounded-lg text-xs ring-1 ring-inset ${
        compact ? 'min-h-9 gap-1.5 px-2 py-1' : 'min-h-11 gap-2 px-2.5 py-1.5'
      } ${state.className}`}
    >
      <state.Icon
        className={`size-4 shrink-0 ${
          state.status === 'checking' ? 'animate-spin' : ''
        }`}
        aria-hidden="true"
      />
      <span
        className={
          compact
            ? 'sr-only min-[380px]:not-sr-only min-[380px]:min-w-0 min-[380px]:max-w-[4.5rem] sm:max-w-none'
            : 'min-w-0'
        }
      >
        <span className="block truncate font-semibold">{state.label}</span>
        <span
          className={
            compact
              ? 'sr-only'
              : 'hidden truncate text-[0.68rem] opacity-80 lg:block'
          }
        >
          {detail}
        </span>
      </span>
      {pendingSummary.total > 0 ? (
        <span
          className="shrink-0 rounded bg-white/60 dark:bg-slate-900/60 px-1.5 py-0.5 font-semibold"
          aria-hidden="true"
        >
          {compact && pendingSummary.total > 99 ? '99+' : pendingSummary.total}
        </span>
      ) : null}
    </span>
  );

  return pendingSummary.total > 0 ? (
    <Link
      to="/sync"
      className={`${
        compact ? 'inline-flex min-h-11 items-center' : 'ml-auto'
      } min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-300`}
      title={`${state.label}: ${detail}`}
      aria-label={`${state.label}. Abrir sincronización: ${pendingSummary.total} cambios pendientes en este dispositivo`}
    >
      {content}
    </Link>
  ) : (
    <span
      className={`${compact ? '' : 'ml-auto'} min-w-0`}
      title={`${state.label}: ${detail}`}
    >
      {content}
    </span>
  );
}
