import { useEffect, useRef } from 'react';
import { ArrowUpRight, CheckCircle2, Smartphone, X } from 'lucide-react';
import { WORKSPACE_NAVIGATION, WorkspaceSection } from './workspace-navigation';

export function Sidebar({
  activeSection,
  onNavigate,
  open,
  onClose,
  isStandalone,
  canInstall,
  onInstall,
}: {
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  open: boolean;
  onClose: () => void;
  isStandalone: boolean;
  canInstall: boolean;
  onInstall: () => void;
}) {
  const aside = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const buttons = aside.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href]'
      );
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [open, onClose]);
  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 1024px)');
    if (!desktop) return;
    const changed = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener('change', changed);
    return () => desktop.removeEventListener('change', changed);
  }, [onClose]);
  return (
    <>
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú desde el fondo"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        ref={aside}
        id="workspace-sidebar"
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label="Navegación de MacroFit"
        className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] flex-col border-r border-slate-800/80 bg-[#0c121e] lg:flex ${
          open ? 'flex shadow-2xl' : 'hidden'
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-xl font-black text-emerald-300">
              M
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-white">
                Macro<span className="text-emerald-400">Fit</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Tu alimentación, cada día
              </p>
            </div>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            className="grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-400 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          aria-label="Módulos de MacroFit"
          className="flex-1 space-y-7 overflow-y-auto px-3 py-5"
        >
          {WORKSPACE_NAVIGATION.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onNavigate(id)}
                    aria-current={activeSection === id ? 'page' : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      activeSection === id
                        ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                    {label}
                    {activeSection === id && (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800/70 p-4">
          {canInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-sm text-slate-300 hover:border-emerald-500/40"
            >
              <Smartphone className="size-5 text-emerald-300" />
              <span className="flex-1">Instalar MacroFit</span>
              <ArrowUpRight className="size-4 text-slate-500" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
              {isStandalone ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : (
                <span className="size-1.5 rounded-full bg-emerald-400" />
              )}
              <span>
                {isStandalone ? 'Aplicación instalada' : 'Tu diario personal'}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
