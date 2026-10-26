import { FormEvent, useRef, useState } from 'react';
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react';
import {
  FoodItem,
  MealTemplate,
  MealTemplateItem,
  MealType,
  QUANTITY_LABELS,
} from '../../types/nutrition';
import {
  previewMealTemplate,
  resolveTemplateFood,
  snapshotMealTemplate,
} from '../../utils/mealTemplates';
import { useSaveAction } from '../../hooks/useSaveAction';
import { ComboDialog } from './ComboDialog';
import {
  COMBO_MEALS,
  ComboSummary,
  comboInput,
  comboNumber,
} from './ComboSummary';

type Row = { key: string; item: MealTemplateItem; amount: string };
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function ComboEditor({
  template,
  foods,
  title,
  onSave,
  onClose,
  onOpenProducts,
}: {
  template: MealTemplate;
  foods: FoodItem[];
  title: string;
  onSave: (template: MealTemplate) => Promise<boolean>;
  onClose: () => void;
  onOpenProducts: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [mealType, setMealType] = useState(template.mealType);
  const [rows, setRows] = useState<Row[]>(() =>
    template.items.map((item) => ({
      key: crypto.randomUUID(),
      item: structuredClone(item),
      amount: String(item.amountGrams),
    }))
  );
  const [picker, setPicker] = useState(rows.length === 0);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [replacing, setReplacing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const search = useRef<HTMLInputElement>(null);
  const { save, saveError } = useSaveAction();
  const draft = {
    ...template,
    name,
    description,
    mealType,
    items: rows.map((row) => ({
      ...row.item,
      amountGrams: row.amount.trim() ? Number(row.amount) : NaN,
    })),
  };
  const preview = previewMealTemplate(draft, foods);
  const candidates = foods.filter(
    (food) =>
      (source !== 'personal' || food.isCustom) &&
      normalize(query)
        .trim()
        .split(/\s+/)
        .every((word) =>
          normalize(
            `${food.name} ${food.brand ?? ''} ${food.barcode ?? ''}`
          ).includes(word)
        )
  );
  function openPicker(key: string | null = null) {
    setReplacing(key);
    setPicker(true);
    setQuery('');
    requestAnimationFrame(() => search.current?.focus());
  }
  function choose(food: FoodItem) {
    const item = {
      foodId: food.id,
      amountGrams: food.servingSizeGrams,
      quantityUnit: food.quantityUnit ?? ('g' as const),
      food: structuredClone(food),
    };
    if (replacing)
      setRows((current) =>
        current.map((row) =>
          row.key === replacing
            ? { ...row, item, amount: String(item.amountGrams) }
            : row
        )
      );
    else if (rows.length < 100)
      setRows((current) => [
        ...current,
        { key: crypto.randomUUID(), item, amount: String(item.amountGrams) },
      ]);
    setPicker(false);
    setReplacing(null);
    setError('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    let parsed: MealTemplate;
    try {
      parsed = snapshotMealTemplate(draft, foods);
    } catch (failure) {
      setError((failure as Error).message);
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    await save(() => onSave(parsed), onClose);
    busy.current = false;
    setSaving(false);
  }
  const formId = `combo-form-${template.id}`;
  return (
    <ComboDialog
      title={title}
      subtitle="Guarda una combinación habitual. El diario solo cambia cuando eliges registrarla."
      wide
      busy={saving}
      onClose={onClose}
      footer={
        <div className="space-y-3">
          <ComboSummary preview={preview} />
          {(error || saveError) && (
            <p role="alert" className="text-xs text-rose-300">
              {error || saveError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-11 rounded-xl px-4 text-sm text-slate-400"
            >
              Cancelar
            </button>
            <button
              form={formId}
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar combo'}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5">
        <fieldset disabled={saving} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <label className="text-xs text-slate-300">
              Nombre del combo
              <input
                data-autofocus
                value={name}
                required
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej.: Mi desayuno habitual"
                className={comboInput}
              />
            </label>
            <label className="text-xs text-slate-300">
              Comida habitual
              <select
                value={mealType}
                onChange={(event) =>
                  setMealType(event.target.value as MealType)
                }
                className={comboInput}
              >
                {Object.entries(COMBO_MEALS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-slate-300">
            Descripción (opcional)
            <input
              value={description}
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
              className={comboInput}
              placeholder="Una nota para distinguir esta combinación"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Alimentos ({rows.length})</h3>
            <button
              type="button"
              disabled={rows.length >= 100}
              onClick={() => openPicker()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/30 px-3 text-xs font-semibold text-emerald-200 disabled:opacity-40"
            >
              <Plus className="size-4" />
              Agregar alimento
            </button>
          </div>
          {picker && (
            <section
              aria-label="Elegir alimentos del combo"
              className="rounded-xl border border-slate-700 bg-slate-950/40 p-3"
            >
              <p className="mb-2 text-xs text-slate-300">
                {replacing
                  ? 'Elige el alimento de reemplazo; su cantidad partirá desde la medida base.'
                  : 'Elige un alimento y ajusta su cantidad en el combo.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1 text-xs">
                  <span className="sr-only">Buscar alimento para el combo</span>
                  <Search className="pointer-events-none absolute left-3 top-4 size-4 text-slate-500" />
                  <input
                    ref={search}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, marca o código"
                    className={`${comboInput} pl-9`}
                  />
                </label>
                <label className="text-xs sm:w-40">
                  <span className="sr-only">Catálogo de alimentos</span>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className={comboInput}
                  >
                    <option value="all">Todos</option>
                    <option value="personal">Mis productos</option>
                  </select>
                </label>
              </div>
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                {candidates.slice(0, 30).map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => choose(food)}
                    aria-label={`Elegir alimento: ${food.name}`}
                    className="flex min-h-14 w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">
                        {food.name}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {food.isCustom
                          ? 'Mi producto'
                          : 'Catálogo base · referencia'}
                        {food.brand ? ` · ${food.brand}` : ''} ·{' '}
                        {food.servingSizeGrams}{' '}
                        {QUANTITY_LABELS[food.quantityUnit ?? 'g']} ·{' '}
                        {comboNumber.format(food.calories)} kcal
                      </span>
                    </span>
                    <Plus className="size-4 shrink-0 text-emerald-300" />
                  </button>
                ))}
                {!candidates.length && (
                  <p className="py-4 text-xs text-slate-400">
                    No hay coincidencias. Puedes guardar el producto en Mis
                    productos y volver a crear el combo.
                  </p>
                )}
              </div>
              {candidates.length > 30 && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Se muestran 30 de {candidates.length}. Afina la búsqueda para
                  encontrar otro alimento.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setPicker(false);
                  setReplacing(null);
                }}
                className="mt-2 min-h-10 px-2 text-xs text-slate-400"
              >
                Cerrar buscador
              </button>
            </section>
          )}
          <ul aria-label="Alimentos del combo" className="space-y-2">
            {rows.map((row, index) => {
              const food = resolveTemplateFood(row.item, foods);
              const nutrients = preview.items[index].nutrients;
              return (
                <li
                  key={row.key}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {food?.name ??
                          row.item.food?.name ??
                          'Alimento no disponible'}
                      </p>
                      {!food && (
                        <p className="mt-1 text-[11px] text-amber-200">
                          Falta el alimento o cambió de unidad. Reemplázalo para
                          continuar.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={`Reemplazar alimento ${index + 1}`}
                        title="Reemplazar alimento"
                        onClick={() => openPicker(row.key)}
                        className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-800"
                      >
                        <RefreshCw className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Quitar alimento ${index + 1}`}
                        title="Quitar alimento"
                        onClick={() =>
                          setRows((current) =>
                            current.filter((item) => item.key !== row.key)
                          )
                        }
                        className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-end gap-3">
                    <label className="w-24 shrink-0 text-[11px] text-slate-400">
                      Cantidad (
                      {
                        QUANTITY_LABELS[
                          row.item.quantityUnit ??
                            row.item.food?.quantityUnit ??
                            'g'
                        ]
                      }
                      )
                      <input
                        aria-label={`Cantidad alimento ${index + 1}`}
                        type="number"
                        min="0.001"
                        max="20000"
                        step="any"
                        required
                        value={row.amount}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.key === row.key
                                ? { ...item, amount: event.target.value }
                                : item
                            )
                          )
                        }
                        className={comboInput}
                      />
                    </label>
                    {nutrients && (
                      <p className="min-w-0 flex-1 pb-1 text-[11px] leading-5 tabular-nums text-slate-400">
                        <span className="block font-semibold text-slate-200">
                          {nutrients.calories} kcal
                        </span>
                        P {comboNumber.format(nutrients.protein)} g · C{' '}
                        {comboNumber.format(nutrients.carbs)} g · G{' '}
                        {comboNumber.format(nutrients.fat)} g
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {!rows.length && (
            <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-400">
              Tu combo todavía no tiene alimentos.
            </p>
          )}
          <p className="text-xs leading-5 text-slate-500">
            Se guardan las cantidades y fichas que estás revisando. Editar un
            producto después no cambia este combo ni las comidas ya registradas.
          </p>
          <button
            type="button"
            onClick={onOpenProducts}
            className="min-h-10 text-xs font-semibold text-emerald-300"
          >
            Ir a Mis productos (descartar este borrador)
          </button>
        </fieldset>
      </form>
    </ComboDialog>
  );
}
