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
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
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
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900 lg:px-8 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200"
    >
      <div className="flex min-w-0 flex-1 basis-full items-start gap-2 sm:basis-0">
        <Laptop className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div role="status" className="min-w-0 text-xs leading-5">
          <p className="font-semibold">
            Trabajando con datos de este dispositivo
          </p>
          <p>{detail}</p>
        </div>
      </div>
      {connectivity.apiReachable ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => offline.setMode('REMOTE')}
          className="h-auto min-h-11 max-w-full shrink-0 whitespace-normal text-xs text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-300/10"
        >
          <Cloud className="size-4 shrink-0" aria-hidden="true" />
          Volver a datos remotos
        </Button>
      ) : null}
    </section>
  );
}
