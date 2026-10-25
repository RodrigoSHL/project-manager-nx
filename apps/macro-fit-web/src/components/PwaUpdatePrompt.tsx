import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdatePrompt() {
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheck = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registered) {
      registration.current = registered ?? null;
    },
  });
  useEffect(() => {
    async function check() {
      const current = registration.current;
      if (
        !current ||
        current.installing ||
        !navigator.onLine ||
        document.visibilityState !== 'visible' ||
        Date.now() - lastCheck.current < 60000
      )
        return;
      lastCheck.current = Date.now();
      // Registration failures leave the current application usable.
      await current.update().catch(() => undefined);
    }
    const interval = window.setInterval(() => void check(), 5 * 60000);
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', check);
      window.removeEventListener('online', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  if (!needRefresh) return null;
  async function update() {
    if (updating) return;
    setUpdating(true);
    setError(false);
    try {
      await updateServiceWorker(true);
    } catch {
      setError(true);
      setUpdating(false);
    }
  }
  if (collapsed)
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[100] flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-xl"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Nueva versión disponible
      </button>
    );
  return (
    <aside
      aria-live="polite"
      aria-label="Actualización de MacroFit"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-emerald-400/30 bg-slate-900 p-4 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <RefreshCw
          className="mt-1 size-5 shrink-0 text-emerald-300"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Nueva versión disponible</p>
          <p className="mt-1 text-sm text-slate-400">
            Guarda tus cambios antes de actualizar. La aplicación se recargará
            cuando pulses el botón.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-300">
              No se pudo actualizar. Revisa tu conexión e inténtalo de nuevo.
            </p>
          )}
          <button
            type="button"
            disabled={updating}
            onClick={() => void update()}
            className="mt-3 min-h-11 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {updating ? 'Actualizando…' : 'Actualizar ahora'}
          </button>
        </div>
        <button
          type="button"
          disabled={updating}
          aria-label="Recordarme más tarde"
          title="Recordarme más tarde"
          onClick={() => setCollapsed(true)}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-800"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
