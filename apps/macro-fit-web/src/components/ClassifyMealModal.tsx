import { useEffect, useRef, useState } from 'react';
import { Check, Package, Search, X } from 'lucide-react';
import {
  FoodItem,
  MealEntry,
  NutritionPlan,
  PautaRule,
  PautaSelection,
  ProductEquivalenceInput,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  QUANTITY_LABELS,
  calculatePauta,
  findPautaRule,
  formatPortions,
  productEquivalenceSchema,
} from '../types/nutrition';
import {
  EquivalenceSuggestionsPanel,
  SuggestEquivalences,
} from './EquivalenceSuggestionsPanel';
import { useSaveAction } from '../hooks/useSaveAction';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
const matches = (text: string, query: string) =>
  normalize(query)
    .trim()
    .split(/\s+/)
    .every((word) => normalize(text).includes(word));
const contributionsText = (rule: PautaRule) =>
  rule.free
    ? 'Libre según tu pauta'
    : rule.contributions
        .map(
          (item) =>
            `${formatPortions(item.portions)} ${PAUTA_LABELS[item.group]}`
        )
        .join(' + ');
const inputClass =
  'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

export function ClassifyMealModal({
  entry,
  plan,
  catalogPlan,
  products,
  onSave,
  onSaveProduct,
  onSuggest,
  onClose,
  onOpenProducts,
}: {
  entry: MealEntry;
  plan: NutritionPlan;
  catalogPlan: NutritionPlan;
  products: FoodItem[];
  onSave: (id: string, selection: PautaSelection) => Promise<boolean>;
  onSaveProduct?: (
    id: string,
    input: ProductEquivalenceInput
  ) => Promise<boolean>;
  onSuggest?: SuggestEquivalences;
  onClose: () => void;
  onOpenProducts?: () => void;
}) {
  const [source, setSource] = useState<'products' | 'rules'>(
    products.length && entry.pauta?.status !== 'matched' ? 'products' : 'rules'
  );
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<FoodItem | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(
    entry.pautaSelection?.ruleId ??
      findPautaRule(plan, entry.foodId, entry.foodName)?.id ??
      null
  );
  const [copying, setCopying] = useState(false);
  const [reference, setReference] = useState('');
  const [unit, setUnit] = useState<PautaRule['unit']>('g');
  const [free, setFree] = useState(false);
  const [portions, setPortions] = useState<
    Partial<Record<(typeof PAUTA_GROUPS)[number], string>>
  >({});
  const [notes, setNotes] = useState('');
  const [converted, setConverted] = useState(
    String(entry.pautaSelection?.quantity?.amount ?? '')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const search = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { save, saveError } = useSaveAction();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    search.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)'
        ) ?? []
      ).filter((item) => item.getClientRects().length > 0);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keyboard);
      previous?.focus();
    };
  }, [onClose]);
  const quantity = entry.quantity ?? {
    amount: entry.amountGrams,
    unit: 'g' as const,
  };
  const draft: PautaRule = {
    id: 'preview-product',
    name: product?.name ?? '',
    foodIds: [],
    aliases: [],
    referenceAmount: Number(reference),
    unit,
    free,
    notes,
    contributions: free
      ? []
      : PAUTA_GROUPS.filter((group) => Number(portions[group]) > 0).map(
          (group) => ({ group, portions: Number(portions[group]) })
        ),
  };
  const selectedRule =
    source === 'products'
      ? product
        ? draft
        : undefined
      : plan.rules.find((rule) => rule.id === ruleId);
  const needsQuantity =
    selectedRule &&
    !selectedRule.free &&
    selectedRule.unit !== quantity.unit &&
    !(quantity.unit === 'g' && selectedRule.gramsPerUnit);
  const selection = selectedRule
    ? {
        ruleId: selectedRule.id,
        ...(needsQuantity && Number(converted) > 0
          ? { quantity: { amount: Number(converted), unit: selectedRule.unit } }
          : {}),
      }
    : { ruleId: null };
  const preview =
    selectedRule &&
    (selectedRule.free ||
      (selectedRule.referenceAmount > 0 &&
        selectedRule.contributions.length > 0))
      ? calculatePauta({ ...plan, rules: [selectedRule] }, entry, selection)
      : null;
  function fill(rule?: PautaRule, food?: FoodItem) {
    setReference(String(rule?.referenceAmount ?? food?.servingSizeGrams ?? ''));
    setUnit(rule?.unit ?? food?.quantityUnit ?? 'g');
    setFree(rule?.free ?? false);
    setPortions(
      Object.fromEntries(
        (rule?.contributions ?? []).map((item) => [
          item.group,
          String(item.portions),
        ])
      )
    );
    setNotes(rule?.notes ?? '');
    setConverted('');
    setError(null);
  }
  function chooseProduct(food: FoodItem) {
    setProduct(food);
    setCopying(false);
    fill(
      findPautaRule(catalogPlan, food.id, food.name) ??
        findPautaRule(plan, food.id, food.name),
      food
    );
    revealDetail();
  }
  function revealDetail() {
    if (window.matchMedia?.('(max-width: 1023px)').matches)
      requestAnimationFrame(() => {
        if (!content.current || !detail.current) return;
        const top =
          detail.current.getBoundingClientRect().top -
          content.current.getBoundingClientRect().top +
          content.current.scrollTop;
        content.current.scrollTo({ top, behavior: 'smooth' });
      });
  }
  function chooseRule(rule: PautaRule) {
    if (copying && product) {
      fill(rule);
      setSource('products');
      setCopying(false);
      setQuery('');
    } else {
      setRuleId(rule.id);
      setConverted('');
      setError(null);
    }
    revealDetail();
  }
  async function submit(pending = false) {
    if (busy.current) return;
    let action: () => Promise<boolean>;
    if (pending) action = () => onSave(entry.id, { ruleId: null });
    else if (source === 'products' && product && onSaveProduct) {
      if (
        !free &&
        Object.values(portions).some(
          (value) =>
            value?.trim() &&
            (!Number.isFinite(Number(value)) ||
              Number(value) < 0 ||
              Number(value) > 1000)
        )
      ) {
        setError('Las porciones deben ser valores entre 0 y 1000.');
        return;
      }
      const parsed = productEquivalenceSchema.safeParse({
        productId: product.id,
        expectedPlanVersion: catalogPlan.version,
        expectedDayPlanVersion: plan.version,
        expectedQuantity: quantity,
        equivalence: {
          referenceAmount: Number(reference),
          unit,
          free,
          contributions: draft.contributions,
          notes,
        },
        ...(needsQuantity
          ? { quantity: { amount: Number(converted), unit } }
          : {}),
      });
      if (!parsed.success || !preview || preview.status === 'pending') {
        setError(
          'Indica la cantidad de referencia y sus porciones, o marca libre según tu pauta. Revisa también las unidades.'
        );
        return;
      }
      action = () => onSaveProduct(entry.id, parsed.data);
    } else if (
      source === 'rules' &&
      selectedRule &&
      preview?.status !== 'pending'
    )
      action = () => onSave(entry.id, selection);
    else {
      setError('Selecciona un producto o una equivalencia para continuar.');
      return;
    }
    setError(null);
    busy.current = true;
    setSaving(true);
    await save(action, onClose);
    busy.current = false;
    setSaving(false);
  }
  const foods = products.filter((food) =>
    matches(`${food.name} ${food.brand ?? ''} ${food.barcode ?? ''}`, query)
  );
  const rules = (copying ? catalogPlan.rules : plan.rules).filter((rule) =>
    matches(
      `${rule.name} ${rule.aliases.join(' ')} ${contributionsText(rule)}`,
      query
    )
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clasificar alimento en mi pauta"
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 sm:p-5"
    >
      <div
        ref={panel}
        className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 p-5 sm:px-6">
          <div>
            <h2 className="text-xl font-bold">
              Clasificar alimento en mi pauta
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {entry.foodName} · {quantity.amount}{' '}
              {QUANTITY_LABELS[quantity.unit]} consumidos · {entry.calories}{' '}
              kcal
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Cerrar clasificación"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <X className="size-5" />
          </button>
        </header>
        <div ref={content} className="min-h-0 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section
              className="min-w-0"
              aria-label="Buscar alimentos y equivalencias"
            >
              <div
                role="group"
                aria-label="Catálogo de clasificación"
                className="flex gap-2"
              >
                {(
                  [
                    ['products', `Mis productos (${products.length})`],
                    [
                      'rules',
                      `Equivalencias de mi pauta (${
                        (copying ? catalogPlan : plan).rules.length
                      })`,
                    ],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={source === value}
                    disabled={saving}
                    onClick={() => {
                      setSource(value);
                      setCopying(false);
                      setQuery('');
                      setConverted('');
                    }}
                    className={`flex-1 rounded-xl border px-3 py-3 text-xs font-semibold ${
                      source === value
                        ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-sm text-slate-300">
                Buscar producto o equivalencia
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-4 size-4 text-slate-500" />
                  <input
                    ref={search}
                    value={query}
                    disabled={saving}
                    onChange={(event) => setQuery(event.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Nombre, marca, código o grupo de pauta"
                  />
                </div>
              </label>
              {copying && (
                <p
                  role="status"
                  className="mt-3 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200"
                >
                  Elige una referencia para copiar a {product?.name}. Puedes
                  ajustar sus valores antes de guardar.
                </p>
              )}
              <p className="my-3 text-xs text-slate-500">
                {source === 'products' ? foods.length : rules.length} resultados
                ·{' '}
                {source === 'products'
                  ? 'Tu catálogo guardado'
                  : 'Referencias de porciones'}
              </p>
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[50vh]">
                {source === 'products'
                  ? foods.slice(0, 80).map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        disabled={saving}
                        aria-label={`Elegir producto: ${food.name}`}
                        aria-pressed={product?.id === food.id}
                        onClick={() => chooseProduct(food)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          product?.id === food.id
                            ? 'border-emerald-400 bg-emerald-400/10'
                            : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
                        }`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <strong className="break-words text-sm">
                            {food.name}
                          </strong>
                          {product?.id === food.id && (
                            <Check className="size-4 shrink-0 text-emerald-300" />
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {[food.brand, food.barcode]
                            .filter(Boolean)
                            .join(' · ') || 'Producto personal'}
                        </span>
                        <span className="mt-2 block text-xs text-slate-300">
                          Por {food.servingSizeGrams}{' '}
                          {QUANTITY_LABELS[food.quantityUnit ?? 'g']}:{' '}
                          {food.calories} kcal
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          Proteínas {food.protein} g · Carbohidratos{' '}
                          {food.carbs} g · Grasas {food.fat} g
                        </span>
                        <span className="mt-2 block text-xs text-emerald-300">
                          {findPautaRule(catalogPlan, food.id, food.name)
                            ? 'Con equivalencia guardada'
                            : 'Necesita definir su equivalencia'}
                        </span>
                      </button>
                    ))
                  : rules.slice(0, 80).map((rule) => (
                      <button
                        key={rule.id}
                        type="button"
                        disabled={saving}
                        aria-label={`Elegir equivalencia: ${rule.name}`}
                        aria-pressed={!copying && ruleId === rule.id}
                        onClick={() => chooseRule(rule)}
                        className={`w-full rounded-xl border p-4 text-left ${
                          !copying && ruleId === rule.id
                            ? 'border-emerald-400 bg-emerald-400/10'
                            : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
                        }`}
                      >
                        <strong className="block text-sm">{rule.name}</strong>
                        <span className="mt-1 block text-xs text-slate-400">
                          {rule.referenceAmount} {QUANTITY_LABELS[rule.unit]} →{' '}
                          {contributionsText(rule)}
                        </span>
                        {rule.notes && (
                          <span className="mt-2 block text-xs text-slate-500">
                            {rule.notes}
                          </span>
                        )}
                      </button>
                    ))}
                {(source === 'products' ? foods : rules).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                    No hay coincidencias. Prueba otro nombre o busca en el otro
                    catálogo.
                  </div>
                )}
                {(source === 'products' ? foods : rules).length > 80 && (
                  <p className="text-xs text-slate-400">
                    Se muestran los primeros 80. Afina tu búsqueda para ver
                    otros resultados.
                  </p>
                )}
              </div>
              {onOpenProducts && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onOpenProducts}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                >
                  <Package className="size-4" />
                  Agregar un producto en Mis productos
                </button>
              )}
            </section>
            <section
              className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:p-5"
              aria-label="Detalle de la clasificación"
              ref={detail}
              tabIndex={-1}
            >
              {onSuggest && (
                <EquivalenceSuggestionsPanel
                  key={JSON.stringify([
                    source,
                    product?.id,
                    entry,
                    plan,
                    catalogPlan,
                  ])}
                  entry={entry}
                  plan={plan}
                  basis={{
                    mealId: entry.id,
                    productId:
                      source === 'products' || copying
                        ? product?.id ?? null
                        : null,
                    dayPlanVersion: plan.version,
                    catalogPlanVersion: catalogPlan.version,
                  }}
                  onSuggest={(useAi, signal) =>
                    onSuggest(
                      entry.id,
                      {
                        productId:
                          source === 'products' || copying
                            ? product?.id
                            : undefined,
                        dayPlanVersion: plan.version,
                        catalogPlanVersion: catalogPlan.version,
                        useAi,
                      },
                      signal
                    )
                  }
                  disabled={saving || (source === 'products' && !product)}
                  onApply={(suggestion) => {
                    if ((source === 'products' || copying) && product) {
                      setSource('products');
                      fill(suggestion.rule, product);
                      if (
                        quantity.unit === 'g' &&
                        suggestion.rule.unit !== 'g' &&
                        suggestion.rule.gramsPerUnit
                      )
                        setConverted(
                          String(quantity.amount / suggestion.rule.gramsPerUnit)
                        );
                      setCopying(false);
                    } else if (suggestion.origin === 'day') {
                      setSource('rules');
                      setCopying(false);
                      chooseRule(suggestion.rule);
                    }
                    detail.current?.focus({ preventScroll: true });
                    revealDetail();
                  }}
                />
              )}

              {source === 'products' && product ? (
                <>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{product.brand}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Su ficha nutricional está guardada. Ahora define cómo suma
                    porciones en tu pauta.
                  </p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setCopying(true);
                      setSource('rules');
                      setQuery('');
                    }}
                    className="mt-3 rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-emerald-200"
                  >
                    Copiar una equivalencia de mi pauta
                  </button>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-xs text-slate-300">
                      Cantidad de referencia
                      <input
                        type="number"
                        min="0.001"
                        max="20000"
                        step="any"
                        value={reference}
                        disabled={saving}
                        onChange={(event) => setReference(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      Unidad de referencia
                      <select
                        value={unit}
                        disabled={saving}
                        onChange={(event) => {
                          setUnit(event.target.value as PautaRule['unit']);
                          setConverted('');
                        }}
                        className={inputClass}
                      >
                        {Object.entries(QUANTITY_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={free}
                      disabled={saving}
                      onChange={(event) => setFree(event.target.checked)}
                      className="mt-1 accent-emerald-400"
                    />
                    Libre según mi pauta (sin sumar porciones)
                  </label>
                  {!free && (
                    <fieldset disabled={saving} className="mt-4">
                      <legend className="mb-2 text-sm font-semibold">
                        ¿Cuántas porciones aporta esa referencia?
                      </legend>
                      <p className="mb-3 text-xs leading-5 text-slate-400">
                        Usa la equivalencia de tu pauta. La tabla nutricional no
                        define estos grupos automáticamente.
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {PAUTA_GROUPS.map((group) => (
                          <label key={group} className="text-xs text-slate-300">
                            {PAUTA_LABELS[group]}
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              step="any"
                              value={portions[group] ?? ''}
                              onChange={(event) =>
                                setPortions((previous) => ({
                                  ...previous,
                                  [group]: event.target.value,
                                }))
                              }
                              placeholder="0"
                              className={inputClass}
                            />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <label className="mt-4 block text-xs text-slate-300">
                    Notas de la equivalencia
                    <textarea
                      value={notes}
                      disabled={saving}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      className={inputClass}
                    />
                  </label>
                </>
              ) : source === 'rules' && selectedRule ? (
                <>
                  <h3 className="text-lg font-bold">{selectedRule.name}</h3>
                  <p className="mt-3 text-sm text-slate-300">
                    {selectedRule.referenceAmount}{' '}
                    {QUANTITY_LABELS[selectedRule.unit]} →{' '}
                    {contributionsText(selectedRule)}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    {selectedRule.notes}
                  </p>
                </>
              ) : (
                <div className="py-8 text-sm leading-7 text-slate-400">
                  <Package className="mb-4 size-8 text-slate-600" />
                  Selecciona tu producto guardado o una equivalencia. Aquí
                  podrás revisar la referencia y el aporte de este consumo antes
                  de confirmar.
                </div>
              )}
              {needsQuantity && (
                <label className="mt-4 block text-sm text-amber-200">
                  Cantidad consumida para la pauta (
                  {QUANTITY_LABELS[selectedRule.unit]})
                  <input
                    type="number"
                    min="0.001"
                    max="20000"
                    step="any"
                    value={converted}
                    disabled={saving}
                    onChange={(event) => setConverted(event.target.value)}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    El consumo está en {QUANTITY_LABELS[quantity.unit]}. Indica
                    su equivalente en {QUANTITY_LABELS[selectedRule.unit]}; no
                    convertimos unidades automáticamente.
                  </span>
                </label>
              )}

              <p className="mt-4 text-xs leading-6 text-slate-400">
                Esta clasificación conserva los {entry.calories} kcal y los
                nutrientes ya registrados. Las metas y las equivalencias de
                otros días se conservan.
              </p>
            </section>
          </div>
        </div>
        <footer className="shrink-0 border-t border-slate-800 bg-slate-900 p-4 sm:px-6">
          {selectedRule && (
            <div className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-2">
              <p className="text-xs font-semibold text-slate-300">
                Este consumo de {quantity.amount}{' '}
                {QUANTITY_LABELS[quantity.unit]} sumará
              </p>
              <p
                role="status"
                className="mt-1 text-sm font-semibold text-emerald-200"
              >
                {!preview || preview.status === 'pending'
                  ? 'Completa la equivalencia para ver el aporte'
                  : preview.status === 'free'
                  ? 'Libre según tu pauta'
                  : preview.contributions
                      .map(
                        (item) =>
                          `${formatPortions(item.portions)} ${
                            PAUTA_LABELS[item.group]
                          }`
                      )
                      .join(' + ')}
              </p>
            </div>
          )}
          {(error || saveError) && (
            <p role="alert" className="mb-3 text-sm text-rose-300">
              {error || saveError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit(true)}
              className="min-h-10 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400"
            >
              Dejar pendiente
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-sm text-slate-300"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={saving || copying}
                onClick={() => void submit()}
                className="min-h-11 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {saving
                  ? 'Guardando…'
                  : source === 'products'
                  ? 'Guardar equivalencia y clasificar'
                  : 'Guardar equivalencia'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
