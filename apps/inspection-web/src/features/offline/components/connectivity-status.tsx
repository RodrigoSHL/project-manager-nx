import { Cloud, CloudOff, ServerOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnectivity } from '../../../hooks/use-connectivity';
import { useOffline } from '../offline-context';

export function ConnectivityStatus() {
  const connectivity = useConnectivity();
  const { pendingSummary } = useOffline();
  const state = !connectivity.browserOnline
    ? {
        Icon: CloudOff,
        label: 'Modo sin conexión',
        detail: 'Los cambios se guardarán en este dispositivo',
        className: 'bg-amber-50 text-amber-900 ring-amber-200',
      }
    : connectivity.apiReachable
    ? {
        Icon: Cloud,
        label: 'En línea',
        detail: 'Servidor disponible',
        className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
      }
    : {
        Icon: ServerOff,
        label: connectivity.checking
          ? 'Comprobando servidor'
          : 'Servidor no disponible',
        detail: 'Usando datos guardados en este dispositivo',
        className: 'bg-red-50 text-red-800 ring-red-200',
      };
  const content = (
    <span
      className={`inline-flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset ${state.className}`}
    >
      <state.Icon className="size-4 shrink-0" />
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate font-semibold">{state.label}</span>
        <span className="hidden truncate text-[0.68rem] opacity-80 lg:block">
          {pendingSummary.total > 0
            ? `${pendingSummary.total} cambios pendientes`
            : state.detail}
        </span>
      </span>
    </span>
  );

  return pendingSummary.total > 0 ? (
    <Link
      to="/sync"
      className="ml-auto min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      aria-label={`Abrir sincronización: ${pendingSummary.total} cambios pendientes`}
    >
      {content}
    </Link>
  ) : (
    <span className="ml-auto min-w-0">{content}</span>
  );
}
