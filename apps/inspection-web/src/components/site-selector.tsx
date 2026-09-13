import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { Site } from '../features/assets/models';

type SiteSelectorProps = {
  sites: Site[];
  siteId: string;
  onChange: (siteId: string) => void;
  disabled?: boolean;
};

export function SiteSelector({
  sites,
  siteId,
  onChange,
  disabled = false,
}: SiteSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSite = sites.find((site) => site.id === siteId);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  function selectSite(nextSiteId: string) {
    onChange(nextSiteId);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative text-sm font-medium text-slate-700"
    >
      <span>Mina / Faena / Sitio</span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        {selectedSite ? (
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-sm font-semibold leading-5 text-slate-900">
              {selectedSite.name}
            </span>
            <span className="shrink-0 truncate font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500">
              {selectedSite.code}
            </span>
          </span>
        ) : (
          <span className="text-sm text-slate-500">
            {disabled ? 'Cargando ubicaciones...' : 'Selecciona una ubicación'}
          </span>
        )}
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && sites.length > 0 ? (
        <div
          role="listbox"
          aria-label="Mina / Faena / Sitio"
          className="absolute inset-x-0 z-20 mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-slate-950/5"
        >
          {sites.map((site) => {
            const selected = site.id === siteId;
            return (
              <button
                key={site.id}
                type="button"
                role="option"
                aria-selected={selected}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                onClick={() => selectSite(site.id)}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {site.name}
                  </span>
                  <span className="shrink-0 truncate font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500">
                    {site.code}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-4 shrink-0 text-slate-700" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
