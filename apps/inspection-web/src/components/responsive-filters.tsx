import { useEffect, useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';

type Props = {
  label: string;
  summary: ReactNode;
  activeCount?: number;
  children: ReactNode;
  mobileContent: ReactNode;
  onOpen: () => void;
  onApply: () => void;
  onReset: () => void;
  canApply?: boolean;
};

export function ResponsiveFilters({
  label,
  summary,
  activeCount = 0,
  children,
  mobileContent,
  onOpen,
  onApply,
  onReset,
  canApply = true,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 768px)');
    if (!desktop) return;
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <>
      <section
        aria-label={label}
        className="hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:block"
      >
        {children}
      </section>
      <section
        aria-label={`${label}: selección actual`}
        className="flex min-w-0 items-start justify-between gap-3 md:hidden"
      >
        <div className="min-w-0 flex-1 break-words text-sm text-slate-600">
          {summary}
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 px-3"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            onOpen();
            setOpen(true);
          }}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </section>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" closeLabel="Cerrar filtros">
          <header className="border-b border-slate-200 px-4 py-4 pr-16">
            <SheetTitle className="text-lg font-semibold text-slate-950">
              {label}
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              Ajusta la selección y pulsa Aplicar filtros.
            </SheetDescription>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
            {mobileContent}
          </div>
          <footer className="flex shrink-0 gap-3 border-t border-slate-200 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-h-11"
              onClick={onReset}
            >
              Restablecer
            </Button>
            <Button
              type="button"
              className="h-auto min-h-11 flex-1"
              disabled={!canApply}
              onClick={() => {
                onApply();
                setOpen(false);
              }}
            >
              Aplicar filtros
            </Button>
          </footer>
        </SheetContent>
      </Sheet>
    </>
  );
}
