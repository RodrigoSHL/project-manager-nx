import { FormEvent, useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import {
  MealEntry,
  QUANTITY_LABELS,
  UpdateMealQuantity,
  updateMealQuantitySchema,
} from '../types/nutrition';
import { useSaveAction } from '../hooks/useSaveAction';

export function EditMealQuantityModal({
  entry,
  onSave,
  onClose,
}: {
  entry: MealEntry;
  onSave: (id: string, input: UpdateMealQuantity) => Promise<boolean>;
  onClose: () => void;
}) {
  const quantity = entry.quantity ?? {
    amount: entry.amountGrams,
    unit: 'g' as const,
  };
  const [amount, setAmount] = useState(String(quantity.amount));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { save, saveError } = useSaveAction();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    inputRef.current?.select();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled),button:not(:disabled)'
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      previous?.focus();
    };
  }, [onClose]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const parsed = updateMealQuantitySchema.safeParse({
      quantity: {
        amount: amount.trim() ? Number(amount) : NaN,
        unit: quantity.unit,
      },
      expectedQuantity: quantity,
    });
    if (!parsed.success) {
      setError('Ingresa una cantidad mayor que cero y de hasta 20000.');
      return;
    }
    setError(null);
    busy.current = true;
    setSaving(true);
    await save(() => onSave(entry.id, parsed.data), onClose);
    busy.current = false;
    setSaving(false);
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-meal-quantity-title"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
    >
      <div
        ref={panel}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="mb-3 inline-flex rounded-xl bg-emerald-400/10 p-2.5 text-emerald-300">
              <Pencil className="size-5" />
            </span>
            <h2 id="edit-meal-quantity-title" className="text-lg font-bold">
              Editar cantidad
            </h2>
            <p className="mt-1 break-words text-sm text-slate-300">
              {entry.foodName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registrado: {quantity.amount} {QUANTITY_LABELS[quantity.unit]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar edición de cantidad"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm text-slate-300">
            Cantidad ({QUANTITY_LABELS[quantity.unit]})
            <input
              ref={inputRef}
              required
              type="number"
              min="0.001"
              max="20000"
              step="any"
              disabled={saving}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>
          <p className="text-xs leading-6 text-slate-400">
            Las calorías, los macros y las porciones de pauta se ajustan
            proporcionalmente a la cantidad. Se conserva la unidad y la
            información nutricional de este registro.
          </p>
          {(error || saveError) && (
            <p
              role="alert"
              className="rounded-lg bg-rose-950/30 p-3 text-sm text-rose-300"
            >
              {error || saveError}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar cantidad'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
