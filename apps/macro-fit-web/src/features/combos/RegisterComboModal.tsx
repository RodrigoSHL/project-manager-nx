import { FormEvent, useRef, useState } from 'react';
import {
  FoodItem,
  MealTemplate,
  MealType,
  NutritionPlan,
  QUANTITY_LABELS,
} from '../../types/nutrition';
import { previewMealTemplate } from '../../utils/mealTemplates';
import { useSaveAction } from '../../hooks/useSaveAction';
import { ComboDialog } from './ComboDialog';
import {
  COMBO_MEALS,
  ComboSummary,
  comboInput,
  comboNumber,
} from './ComboSummary';

export function RegisterComboModal({
  template,
  foods,
  date,
  plan,
  onApply,
  onClose,
}: {
  template: MealTemplate;
  foods: FoodItem[];
  date: string;
  plan?: NutritionPlan | null;
  onApply: (template: MealTemplate, mealType?: MealType) => Promise<boolean>;
  onClose: () => void;
}) {
  const [factor, setFactor] = useState('1');
  const [amounts, setAmounts] = useState<string[] | null>(null);
  const [meal, setMeal] = useState(template.mealType);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const { save, saveError } = useSaveAction();
  const multiplier = factor.trim() ? Number(factor) : NaN;
  const validFactor =
    Number.isFinite(multiplier) && multiplier >= 0.01 && multiplier <= 20;
  const scaled: MealTemplate = {
    ...template,
    items: template.items.map((item, index) => ({
      ...item,
      amountGrams: amounts
        ? amounts[index].trim()
          ? Number(amounts[index])
          : NaN
        : Number((item.amountGrams * multiplier).toPrecision(12)),
    })),
  };
  const preview = previewMealTemplate(
    scaled,
    foods,
    validFactor ? 1 : NaN,
    plan
  );
  const formId = `register-combo-${template.id}`;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || !preview.complete || !validFactor) return;
    busy.current = true;
    setSaving(true);
    await save(() => onApply(scaled, meal), onClose);
    busy.current = false;
    setSaving(false);
  }
  return (
    <ComboDialog
      title="Registrar combo"
      subtitle={`${template.name} · Diario del ${date}`}
      busy={saving}
      onClose={onClose}
      footer={
        <div className="space-y-3">
          <ComboSummary preview={preview} showPauta={!!plan?.enabled} />
          {saveError && (
            <p role="alert" className="text-xs text-rose-300">
              {saveError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 px-4 text-sm text-slate-400"
            >
              Cancelar
            </button>
            <button
              form={formId}
              type="submit"
              disabled={saving || !preview.complete}
              className="min-h-11 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {saving ? 'Registrando…' : 'Confirmar y registrar'}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={submit}>
        <fieldset disabled={saving} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-300">
              Tiempo de comida
              <select
                data-autofocus
                value={meal}
                onChange={(event) => setMeal(event.target.value as MealType)}
                className={comboInput}
              >
                {Object.entries(COMBO_MEALS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-300">
              Veces el combo
              <input
                type="number"
                min="0.01"
                max="20"
                step="any"
                required
                value={factor}
                onChange={(event) => {
                  setFactor(event.target.value);
                  setAmounts(null);
                }}
                className={comboInput}
              />
            </label>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Cantidad del combo"
          >
            {[
              [0.5, 'Mitad'],
              [1, 'Completo'],
              [2, 'Doble'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFactor(String(value));
                  setAmounts(null);
                }}
                aria-pressed={Number(factor) === value && !amounts}
                className="min-h-10 rounded-lg border border-slate-700 px-3 text-xs text-slate-300 aria-pressed:border-emerald-400/50 aria-pressed:bg-emerald-400/10 aria-pressed:text-emerald-200"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Ajusta el combo completo o las cantidades de abajo para este
            registro. Cambiar el factor reinicia esos ajustes. Tu combo guardado
            se conserva.
          </p>
          <ul
            aria-label="Alimentos que se registrarán"
            className="divide-y divide-slate-800"
          >
            {preview.items.map((item, index) => (
              <li
                key={`${item.item.foodId}-${index}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">
                    {item.food?.name ??
                      item.item.food?.name ??
                      'Alimento no disponible'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.nutrients
                      ? `${comboNumber.format(item.nutrients.calories)} kcal`
                      : 'Revisa el alimento o la cantidad en Mis combos'}
                  </p>
                </div>
                <label className="w-28 shrink-0 text-[10px] text-slate-400">
                  <span className="sr-only">
                    Cantidad para registrar {index + 1}{' '}
                  </span>
                  {
                    QUANTITY_LABELS[
                      item.item.quantityUnit ??
                        item.item.food?.quantityUnit ??
                        'g'
                    ]
                  }
                  <input
                    type="number"
                    required
                    min="0.001"
                    max="20000"
                    step="any"
                    value={
                      amounts
                        ? amounts[index]
                        : Number.isFinite(item.amount)
                        ? item.amount
                        : ''
                    }
                    onChange={(event) =>
                      setAmounts((current) =>
                        (
                          current ??
                          scaled.items.map((value) => String(value.amountGrams))
                        ).map((value, position) =>
                          position === index ? event.target.value : value
                        )
                      )
                    }
                    className={comboInput}
                  />
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </form>
    </ComboDialog>
  );
}
