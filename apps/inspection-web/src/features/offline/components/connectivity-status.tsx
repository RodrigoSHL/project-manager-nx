import { Cloud, CloudOff, Loader2, ServerOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnectivity } from '../../../hooks/use-connectivity';
import { useOffline } from '../offline-context';
import { connectionPresentation } from '../../connectivity/connectivity-presentation';

export function ConnectivityStatus() {
  const connectivity = useConnectivity();
  const { pendingSummary } = useOffline();
  const presentation = connectionPresentation(connectivity);
  const appearances = {
    offline: {
      Icon: CloudOff,
      className:
        'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-amber-200 dark:ring-amber-800',
    },
    online: {
      Icon: Cloud,
      className:
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-emerald-200 dark:ring-emerald-800',
    },
    checking: {
      Icon: Loader2,
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800',
    },
    unavailable: {
      Icon: ServerOff,
      className:
        'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 ring-red-200 dark:ring-red-800',
    },
  };
  const state = { ...presentation, ...appearances[presentation.status] };
  const content = (
    <span
      className={`inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset ${state.className}`}
    >
      <state.Icon
        className={`size-4 shrink-0 ${
          state.status === 'checking' ? 'animate-spin' : ''
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{state.label}</span>
        <span className="hidden truncate text-[0.68rem] opacity-80 lg:block">
          {pendingSummary.total > 0
            ? `${pendingSummary.total} cambios pendientes en este dispositivo`
            : state.detail}
        </span>
      </span>
      {pendingSummary.total > 0 ? (
        <span
          className="shrink-0 rounded bg-white/60 dark:bg-slate-900/60 px-1.5 py-0.5 font-semibold"
          aria-hidden="true"
        >
          {pendingSummary.total}
        </span>
      ) : null}
    </span>
  );

  return pendingSummary.total > 0 ? (
    <Link
      to="/sync"
      className="ml-auto min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
      aria-label={`Abrir sincronización: ${pendingSummary.total} cambios pendientes en este dispositivo`}
    >
      {content}
    </Link>
  ) : (
    <span className="ml-auto min-w-0">{content}</span>
  );
}
