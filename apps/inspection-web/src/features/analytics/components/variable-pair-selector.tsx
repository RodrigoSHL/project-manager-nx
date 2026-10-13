import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Asset } from '../../assets/models';
import type { AnalyticsConcept } from '../models';
import { Button } from '../../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '../../../components/ui/sheet';

export type VariablePair = { assetId: string; conceptId: string };
type Props = {
  label: string;
  value: VariablePair;
  assets: Asset[];
  concepts: AnalyticsConcept[];
  disabled: boolean;
  loading: boolean;
  onChange: (pair: VariablePair) => void;
};

function PairFields({
  value,
  assets,
  concepts,
  disabled,
  loading,
  onChange,
}: Omit<Props, 'label'>) {
  const inputClass =
    'mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 disabled:bg-slate-50 dark:disabled:bg-slate-950 md:text-sm';
  return (
    <div className="grid min-w-0 gap-3">
      <label className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
        Activo
        <select
          className={inputClass}
          value={value.assetId}
          onChange={(event) =>
            onChange({ ...value, assetId: event.target.value })
          }
          disabled={disabled || loading}
        >
          <option value="">Selecciona un activo</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} · {asset.code}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
        Medición
        <select
          className={inputClass}
          value={value.conceptId}
          onChange={(event) =>
            onChange({ ...value, conceptId: event.target.value })
          }
          disabled={disabled || loading}
        >
          <option value="">Selecciona una medición</option>
          {concepts.map((concept) => (
            <option key={concept.id} value={concept.id}>
              {concept.name}
              {concept.unit ? ` (${concept.unit})` : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function VariablePairSelector(props: Props) {
  const { label, value, assets, concepts, disabled, loading } = props;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const asset = assets.find((item) => item.id === value.assetId);
  const concept = concepts.find((item) => item.id === value.conceptId);
  const selected = Boolean(asset && concept);
  const cleared =
    !draft.assetId &&
    !draft.conceptId &&
    Boolean(value.assetId || value.conceptId);
  const canApply =
    !disabled &&
    !loading &&
    (cleared ||
      (assets.some((item) => item.id === draft.assetId) &&
        concepts.some((item) => item.id === draft.conceptId)));
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
      <fieldset className="hidden min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:block md:p-5">
        <legend className="px-1 font-semibold text-slate-900 dark:text-slate-100">{label}</legend>
        <PairFields {...props} />
      </fieldset>
      <section
        aria-label={label}
        className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm md:hidden"
      >
        <button
          type="button"
          className="flex min-h-16 w-full items-start justify-between gap-3 text-left disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
          aria-label={`${selected ? 'Cambiar' : 'Elegir'} ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled || loading}
          onClick={() => {
            setDraft(value);
            setOpen(true);
          }}
        >
          <span className="min-w-0 break-words">
            <span className="block text-sm font-semibold text-slate-950 dark:text-slate-100">
              {label}
            </span>
            <span className="mt-1 block text-sm text-slate-700 dark:text-slate-200">
              {asset?.name ??
                (disabled
                  ? 'Selecciona una faena primero'
                  : loading
                  ? 'Cargando activos…'
                  : 'Elegir activo y medición')}
            </span>
            {concept ? (
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {concept.name}
                {concept.unit ? ` · ${concept.unit}` : ''}
              </span>
            ) : null}
          </span>
          <span className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {selected ? 'Cambiar' : 'Elegir'}
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        </button>
      </section>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" closeLabel={`Cerrar ${label}`}>
          <header className="border-b border-slate-200 dark:border-slate-800 p-4 pr-16">
            <SheetTitle className="text-lg font-semibold text-slate-950 dark:text-slate-100">
              {label}
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Selecciona el activo y la medición a comparar.
            </SheetDescription>
          </header>
          <div className="min-h-0 overflow-y-auto p-4">
            <PairFields {...props} value={draft} onChange={setDraft} />
          </div>
          <footer className="flex shrink-0 gap-3 border-t border-slate-200 dark:border-slate-800 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-h-11"
              onClick={() => setDraft({ assetId: '', conceptId: '' })}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              className="h-auto min-h-11 flex-1"
              disabled={!canApply}
              onClick={() => {
                props.onChange(draft);
                setOpen(false);
              }}
            >
              Guardar selección
            </Button>
          </footer>
        </SheetContent>
      </Sheet>
    </>
  );
}
