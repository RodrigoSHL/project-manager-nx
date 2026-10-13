import { Cloud, Laptop } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useConnectivity } from '../../../hooks/use-connectivity';
import { useOffline } from '../offline-context';

export function DataSourceStatus() {
  const { mode } = useOffline();
  const local = mode === 'LOCAL';
  const label = local ? 'Copia local' : 'Datos remotos';
  const Icon = local ? Laptop : Cloud;

  return (
    <span
      role="status"
      aria-label={`Origen de datos: ${label}`}
      title={
        local ? 'Datos guardados en este dispositivo' : 'Datos del servidor'
      }
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
        local
          ? 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25'
          : 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="sm:hidden">{local ? 'Local' : 'Remoto'}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function LocalDataBanner() {
  const offline = useOffline();
  const connectivity = useConnectivity();
  if (offline.mode !== 'LOCAL') return null;

  const detail = connectivity.apiReachable
    ? 'Los cambios se guardan en este dispositivo.'
    : connectivity.checking && connectivity.browserOnline
    ? 'Comprobando la conexión con el servidor…'
    : 'El servidor no está disponible. Los cambios se guardan en este dispositivo.';

  return (
    <section
      aria-label="Uso de copia local"
      title={detail}
      className="flex min-h-11 min-w-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 text-amber-900 md:px-6 xl:px-8 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200"
    >
      <p role="status" className="min-w-0 flex-1 truncate text-xs">
        <span>Datos en este dispositivo</span>
        <span className="sr-only">. {detail}</span>
      </p>
      {connectivity.apiReachable ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => offline.setMode('REMOTE')}
          aria-label="Volver a datos remotos"
          className="h-8 min-h-8 shrink-0 border-amber-200/80 bg-white/60 px-2.5 text-xs font-medium text-amber-900 shadow-none hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-300/5 dark:text-amber-200 dark:hover:bg-amber-300/10 [&_svg]:size-3.5"
        >
          <Cloud className="size-4 shrink-0" aria-hidden="true" />
          <span className="sm:hidden">Usar remoto</span>
          <span className="hidden sm:inline">Usar datos remotos</span>
        </Button>
      ) : null}
    </section>
  );
}
