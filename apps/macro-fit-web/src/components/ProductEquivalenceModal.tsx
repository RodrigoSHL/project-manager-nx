import { useEffect, useRef, useState } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import {
  FoodItem,
  NutritionPlan,
  PautaRule,
  ProductSuggestionRequest,
  EquivalenceSuggestions,
  SaveProductEquivalence,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  QUANTITY_LABELS,
  findPautaRule,
  calculatePauta,
  formatPortions,
  saveProductEquivalenceSchema,
} from '../types/nutrition';
import { EquivalenceSuggestionsPanel } from './EquivalenceSuggestionsPanel';
import { useSaveAction } from '../hooks/useSaveAction';

export type SuggestProductEquivalence = (
  id: string,
  input: ProductSuggestionRequest,
  signal: AbortSignal
) => Promise<EquivalenceSuggestions>;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const inputClass =
  'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

export function ProductEquivalenceModal({
  food,
  plan,
  onSave,
  onSuggest,
  onClose,
  onOpenPlan,
}: {
  food: FoodItem;
  plan?: NutritionPlan | null;
  onSave: (id: string, input: SaveProductEquivalence) => Promise<boolean>;
  onSuggest: SuggestProductEquivalence;
  onClose: () => void;
  onOpenPlan: () => void;
}) {
  const existing = plan ? findPautaRule(plan, food.id, food.name) : undefined;
  const [version] = useState(plan?.version ?? null);
  const [amount, setAmount] = useState(
    String(existing?.referenceAmount ?? food.servingSizeGrams)
  );
  const [unit, setUnit] = useState<PautaRule['unit']>(
    existing?.unit ?? food.quantityUnit ?? 'g'
  );
  const [free, setFree] = useState(existing?.free ?? false);
  const [portions, setPortions] = useState<
    Partial<Record<(typeof PAUTA_GROUPS)[number], string>>
  >(() =>
    Object.fromEntries(
      (existing?.contributions ?? []).map((item) => [
        item.group,
        String(item.portions),
      ])
    )
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const { save, saveError } = useSaveAction();
  const active = !!plan?.enabled;
  const stale = version !== (plan?.version ?? null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    heading.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const elements = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)'
        ) ?? []
      ).filter((item) => item.getClientRects().length > 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === heading.current)
      ) {
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
  function apply(rule: PautaRule) {
    setAmount(String(rule.referenceAmount));
    setUnit(rule.unit);
    setFree(rule.free);
    setPortions(
      Object.fromEntries(
        rule.contributions.map((item) => [item.group, String(item.portions)])
      )
    );
    setNotes(rule.notes);
    setError('');
    formHeading.current?.focus({ preventScroll: true });
    if (window.matchMedia?.('(max-width: 1023px)').matches)
      requestAnimationFrame(() => {
        if (!content.current || !formHeading.current) return;
        const top =
          formHeading.current.getBoundingClientRect().top -
          content.current.getBoundingClientRect().top +
          content.current.scrollTop;
        content.current.scrollTo({ top, behavior: 'smooth' });
      });
  }
  async function submit() {
    if (busy.current || !active || !plan || stale) return;
    if (
      !free &&
      Object.values(portions).some(
        (value) =>
          value?.trim() &&
          (!Number.isFinite(Number(value)) || Number(value) < 0)
      )
    ) {
      setError('Las porciones deben ser números positivos o cero.');
      return;
    }
    const parsed = saveProductEquivalenceSchema.safeParse({
      expectedPlanVersion: version,
      equivalence: {
        referenceAmount: Number(amount),
        unit,
        free,
        notes,
        contributions: free
          ? []
          : PAUTA_GROUPS.filter((group) => Number(portions[group]) > 0).map(
              (group) => ({ group, portions: Number(portions[group]) })
            ),
      },
    });
    if (!parsed.success) {
      setError(
        'Indica una cantidad positiva y las porciones que aporta, o marca libre solo si tu pauta lo indica.'
      );
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    await save(() => onSave(food.id, parsed.data), onClose);
    busy.current = false;
    setSaving(false);
  }
  const draftRule: PautaRule = {
    id: 'product-preview',
    name: food.name,
    foodIds: [food.id],
    aliases: [],
    referenceAmount: Number(amount),
    unit,
    free,
    notes,
    contributions: free
      ? []
      : PAUTA_GROUPS.filter((group) => Number(portions[group]) > 0).map(
          (group) => ({ group, portions: Number(portions[group]) })
        ),
  };
  const preview =
    active &&
    plan &&
    Number(amount) > 0 &&
    (free || draftRule.contributions.length > 0)
      ? calculatePauta(
          { ...plan, rules: [draftRule] },
          {
            foodId: food.id,
            foodName: food.name,
            amountGrams: food.servingSizeGrams,
            quantity: {
              amount: food.servingSizeGrams,
              unit: food.quantityUnit ?? 'g',
            },
          },
          { ruleId: draftRule.id }
        )
      : null;
  const rules = (plan?.rules ?? []).filter((rule) =>
    normalize(`${rule.name} ${rule.aliases.join(' ')}`).includes(
      normalize(query.trim())
    )
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Equivalencia del producto"
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 sm:p-5"
    >
      <div
        ref={panel}
        className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 p-5">
          <div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-xl font-bold outline-none"
            >
              Equivalencia del producto
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {food.name} · Ficha nutricional guardada
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar equivalencia del producto"
            disabled={saving}
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300"
          >
            <X className="size-5" />
          </button>
        </header>
        <div ref={content} className="min-h-0 overflow-y-auto p-5 sm:p-6">
          {stale && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200"
            >
              Tu pauta cambió. Cierra y vuelve a abrir este producto antes de
              continuar; tus ediciones aún no se guardaron.
            </p>
          )}
          {!active ? (
            <div className="space-y-4 rounded-2xl border border-slate-700 p-5">
              <BookOpen className="size-7 text-emerald-300" />
              <h3 className="text-lg font-semibold">
                La equivalencia puede esperar
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Tu producto conserva sus calorías y macros. Configura o activa
                tu pauta para definir cómo suma porciones y comparar sus
                referencias con ayuda de IA.
              </p>
              <p className="text-sm text-slate-400">
                Los gramos de nutrientes no indican por sí solos cuántas
                porciones pide tu pauta.
              </p>
              <button
                onClick={onOpenPlan}
                className="rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950"
              >
                Configurar mi pauta
              </button>
            </div>
          ) : (
            plan && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section
                  className="min-w-0"
                  aria-label="Producto y referencias de mi pauta"
                >
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                    <h3 className="font-semibold">{food.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{food.brand}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      Por {food.servingSizeGrams}{' '}
                      {QUANTITY_LABELS[food.quantityUnit ?? 'g']}
                    </p>
                    <p className="mt-1 text-sm">
                      {food.calories} kcal · Proteínas {food.protein} g ·
                      Carbohidratos {food.carbs} g · Grasas {food.fat} g
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                      Estos son sus nutrientes. La referencia de tu pauta define
                      las porciones por separado.
                    </p>
                  </div>
                  <label className="mt-5 block text-sm text-slate-300">
                    Buscar referencia de mi pauta
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-4 size-4 text-slate-500" />
                      <input
                        disabled={saving || stale}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className={`${inputClass} pl-9`}
                        placeholder="Nombre o alias del alimento"
                      />
                    </div>
                  </label>
                  <p className="my-3 text-xs text-slate-400">
                    {rules.length} referencias · Elegir una solo completa el
                    formulario.
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {rules.slice(0, 40).map((rule) => (
                      <button
                        type="button"
                        key={rule.id}
                        disabled={saving || stale}
                        onClick={() => apply(rule)}
                        aria-label={`Copiar referencia: ${rule.name}`}
                        className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-left hover:border-emerald-400/50 disabled:opacity-50"
                      >
                        <span className="block text-sm font-semibold">
                          {rule.name}
                        </span>
                        <span className="mt-1 block text-xs text-emerald-200">
                          {formatPortions(rule.referenceAmount)}{' '}
                          {QUANTITY_LABELS[rule.unit]} →{' '}
                          {rule.free
                            ? 'Libre según esta referencia'
                            : rule.contributions
                                .map(
                                  (item) =>
                                    `${formatPortions(item.portions)} ${
                                      PAUTA_LABELS[item.group]
                                    }`
                                )
                                .join(' + ')}
                        </span>
                      </button>
                    ))}
                    {!rules.length && (
                      <p className="text-sm text-slate-400">
                        No hay referencias con ese nombre. Puedes completar la
                        equivalencia manualmente desde tu pauta.
                      </p>
                    )}
                  </div>
                </section>
                <section
                  aria-label="Definir equivalencia del producto"
                  className="min-w-0"
                >
                  <EquivalenceSuggestionsPanel
                    key={JSON.stringify([food, plan])}
                    entry={{
                      foodId: food.id,
                      foodName: food.name,
                      amountGrams: food.servingSizeGrams,
                      quantity: {
                        amount: food.servingSizeGrams,
                        unit: food.quantityUnit ?? 'g',
                      },
                    }}
                    plan={plan}
                    basis={{
                      mealId: null,
                      productId: food.id,
                      dayPlanVersion: null,
                      catalogPlanVersion: plan.version,
                    }}
                    previewLabel={`Para ${food.servingSizeGrams} ${
                      QUANTITY_LABELS[food.quantityUnit ?? 'g']
                    } del producto`}
                    onSuggest={(useAi, signal) =>
                      onSuggest(
                        food.id,
                        { catalogPlanVersion: version, useAi },
                        signal
                      )
                    }
                    onApply={(suggestion) => apply(suggestion.rule)}
                    disabled={saving || stale}
                  />
                  <h3
                    ref={formHeading}
                    tabIndex={-1}
                    className="font-semibold outline-none"
                  >
                    Porciones de mi pauta
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Define cuánto aporta una cantidad de referencia de este
                    producto. Se reutilizará cuando lo registres; no estás
                    agregando una comida.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-xs text-slate-300">
                      Cantidad de referencia
                      <input
                        type="number"
                        min="0.001"
                        max="20000"
                        step="any"
                        value={amount}
                        disabled={saving || stale}
                        onChange={(event) => setAmount(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      Unidad de referencia
                      <select
                        value={unit}
                        disabled={saving || stale}
                        onChange={(event) =>
                          setUnit(event.target.value as PautaRule['unit'])
                        }
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
                  <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={free}
                      disabled={saving || stale}
                      onChange={(event) => setFree(event.target.checked)}
                    />
                    Libre según mi pauta (sin sumar porciones)
                  </label>
                  {!free && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {PAUTA_GROUPS.map((group) => (
                        <label key={group} className="text-xs text-slate-300">
                          {PAUTA_LABELS[group]}
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            step="any"
                            value={portions[group] ?? ''}
                            disabled={saving || stale}
                            onChange={(event) =>
                              setPortions((previous) => ({
                                ...previous,
                                [group]: event.target.value,
                              }))
                            }
                            className={inputClass}
                            placeholder="0"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  {!free && unit !== (food.quantityUnit ?? 'g') && (
                    <p className="mt-3 text-xs leading-relaxed text-amber-200">
                      El producto se registra en{' '}
                      {QUANTITY_LABELS[food.quantityUnit ?? 'g']}, pero esta
                      referencia está en {QUANTITY_LABELS[unit]}. Al consumirlo
                      tendrás que indicar la cantidad para la pauta en{' '}
                      {QUANTITY_LABELS[unit]}; no se infiere una conversión.
                    </p>
                  )}
                  <label className="mt-4 block text-xs text-slate-300">
                    Notas de la equivalencia
                    <textarea
                      value={notes}
                      maxLength={2000}
                      disabled={saving || stale}
                      onChange={(event) => setNotes(event.target.value)}
                      className={inputClass}
                      rows={3}
                    />
                  </label>
                </section>
              </div>
            )
          )}
        </div>
        <footer className="shrink-0 border-t border-slate-800 bg-slate-900 p-4 sm:px-6">
          {active && (
            <p
              role="status"
              className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200"
            >
              Por {food.servingSizeGrams}{' '}
              {QUANTITY_LABELS[food.quantityUnit ?? 'g']} de este producto:{' '}
              {preview?.status === 'matched'
                ? preview.contributions
                    .map(
                      (item) =>
                        `${formatPortions(item.portions)} ${
                          PAUTA_LABELS[item.group]
                        }`
                    )
                    .join(' + ')
                : preview?.status === 'free'
                ? 'Libre según tu pauta'
                : 'Completa la referencia y revisa sus unidades para ver las porciones.'}
            </p>
          )}
          <p className="mb-3 text-xs text-slate-400">
            Se guarda en tu pauta para próximos registros. Las comidas ya
            guardadas mantienen su versión.
          </p>
          {(error || saveError) && (
            <p role="alert" className="mb-3 text-sm text-rose-300">
              {error || saveError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300"
            >
              Más tarde
            </button>
            {active && (
              <button
                type="button"
                disabled={saving || stale}
                onClick={() => void submit()}
                className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar equivalencia del producto'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
