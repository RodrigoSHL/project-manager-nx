import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export function ComboDialog({
  title,
  subtitle,
  busy,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const heading = useId();
  const panel = useRef<HTMLDivElement>(null);
  const current = useRef({ busy, onClose });
  current.current = { busy, onClose };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (
      panel.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel.current?.querySelector<HTMLElement>('input,button')
    )?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !current.current.busy) {
        event.preventDefault();
        current.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,a[href]'
        ) ?? []
      ).filter(
        (item) => !item.matches(':disabled') && !item.closest('[hidden]')
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keyboard);
      if (previous?.isConnected) previous.focus();
      else
        document.querySelector<HTMLElement>('[data-combos-heading]')?.focus();
    };
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={heading}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm sm:p-5"
    >
      <div
        ref={panel}
        className={`flex h-[100dvh] w-full flex-col overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl ${
          wide ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 p-4 sm:px-6">
          <div>
            <h2 id={heading} className="text-lg font-bold">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Cerrar ${title.toLowerCase()}`}
            disabled={busy}
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-slate-800 bg-slate-900 p-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
