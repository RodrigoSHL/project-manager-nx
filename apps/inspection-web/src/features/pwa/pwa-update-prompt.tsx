import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../../components/ui/button';

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
          {needRefresh ? (
            <RefreshCw className="size-5" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-700" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-950">
            {needRefresh
              ? 'Nueva versión disponible'
              : 'Aplicación preparada para uso sin conexión'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {needRefresh
              ? 'Actualiza cuando termines de guardar lo que estás revisando.'
              : 'El esqueleto de la aplicación quedó guardado en este dispositivo.'}
          </p>
          {needRefresh ? (
            <Button
              type="button"
              className="mt-3 h-9 px-3 text-sm"
              onClick={() => void updateServiceWorker(true)}
            >
              Actualizar ahora
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Cerrar aviso"
          onClick={() => {
            setOfflineReady(false);
            setNeedRefresh(false);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
