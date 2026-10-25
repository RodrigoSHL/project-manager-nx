import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { FoodItem, MealType, QUANTITY_LABELS } from '../../types/nutrition';
import { useSaveAction } from '../../hooks/useSaveAction';
import {
  FoodGuide,
  FoodIdea,
  NUTRIENT_KEYS,
  NUTRIENT_LABELS,
  resizeFoodIdea,
} from './food-guide';
import { FoodIdeaImpact } from './FoodIdeaImpact';

const mealLabels: Record<MealType, string> = {
  breakfast: 'Desayuno',
  colacion_am: 'Colación mañana',
  lunch: 'Almuerzo',
  colacion_pm: 'Colación tarde',
  dinner: 'Cena',
  snacks: 'Snacks / extra',
};
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
export function RegisterFoodIdeaModal({
  date,
  idea,
  guide,
  onAdd,
  onClose,
}: {
  date: string;
  idea: FoodIdea;
  guide: FoodGuide;
  onAdd: (type: MealType, food: FoodItem, amount: number) => Promise<boolean>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(idea.quantity!.amount));
  const [meal, setMeal] = useState<MealType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { save, saveError } = useSaveAction();
  const value = amount.trim() ? Number(amount) : NaN;
  const valid = Number.isFinite(value) && value > 0 && value <= 20000;
  const preview = valid ? resizeFoodIdea(idea, value, guide) : null;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    input.current?.select();
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled),select:not(:disabled),button:not(:disabled)'
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
    }
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keyboard);
      if (previous?.isConnected) previous.focus();
      else
        document
          .querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
          ?.focus();
    };
  }, [onClose]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    if (!valid || !meal || !idea.food) {
      setError(
        'Elige un tiempo de comida y una cantidad mayor que cero, de hasta 20000.'
      );
      return;
    }
    setError(null);
    busy.current = true;
    setSaving(true);
    await save(() => onAdd(meal, idea.food!, value), onClose);
    busy.current = false;
    setSaving(false);
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-food-idea-title"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
    >
      <div
        ref={panel}
        className="my-3 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="register-food-idea-title" className="text-lg font-bold">
              Registrar esta opción
            </h2>
            <p className="mt-1 text-sm text-slate-300">{idea.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              Se agregará al diario del <time dateTime={date}>{date}</time>.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar registro"
            disabled={saving}
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Cantidad ({QUANTITY_LABELS[idea.quantity!.unit]})
              <input
                ref={input}
                type="number"
                required
                min="0.001"
                max="20000"
                step="any"
                value={amount}
                disabled={saving}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-300">
              Tiempo de comida
              <select
                required
                value={meal}
                disabled={saving}
                onChange={(event) =>
                  setMeal(event.target.value as MealType | '')
                }
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="">Selecciona…</option>
                {Object.entries(mealLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {preview?.nutrients && (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <caption className="bg-slate-950/40 px-3 py-2 text-left font-semibold text-slate-300">
                    Así quedaría tu día
                  </caption>
                  <thead className="text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Indicador
                      </th>
                      <th scope="col">Esta opción</th>
                      <th scope="col">Total / meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NUTRIENT_KEYS.map((key) => (
                      <tr key={key} className="border-t border-slate-800">
                        <th
                          scope="row"
                          className="px-3 py-2 font-normal text-slate-400"
                        >
                          {NUTRIENT_LABELS[key]}
                        </th>
                        <td className="tabular-nums">
                          +{number.format(preview.nutrients![key])}{' '}
                          {key === 'calories' ? 'kcal' : 'g'}
                        </td>
                        <td className="pr-2 tabular-nums">
                          {number.format(
                            guide.consumed[key] + preview.nutrients![key]
                          )}{' '}
                          / {number.format(guide.goals[key])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <FoodIdeaImpact idea={preview} />
            </>
          )}
          {(error || saveError) && (
            <p
              role="alert"
              className="rounded-lg bg-rose-950/30 p-3 text-sm text-rose-200"
            >
              {error || saveError}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-11 rounded-xl px-4 text-sm text-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-xl bg-teal-400 px-4 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Confirmar y registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
