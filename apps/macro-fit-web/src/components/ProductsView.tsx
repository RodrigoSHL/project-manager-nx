import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, PackagePlus, Search } from 'lucide-react';
import {
  FoodItem,
  ProductDraft,
  NutritionPlan,
  SaveProductEquivalence,
  PAUTA_LABELS,
  findPautaRule,
  formatPortions,
  QUANTITY_LABELS,
} from '../types/nutrition';
import {
  ProductEquivalenceModal,
  SuggestProductEquivalence,
} from './ProductEquivalenceModal';
import { searchProducts } from '../utils/productApi';
import { emptyProduct, ProductEditor, productToDraft } from './ProductEditor';

export function ProductsView({
  foods,
  onSave,
  onDelete,
  onOpenPlan,
  plan,
  onSaveEquivalence,
  onSuggestEquivalence,
}: {
  foods: FoodItem[];
  plan?: NutritionPlan | null;
  onSaveEquivalence?: (
    id: string,
    input: SaveProductEquivalence
  ) => Promise<boolean>;
  onSuggestEquivalence?: SuggestProductEquivalence;
  onSave: (food: FoodItem) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenPlan: () => void;
}) {
  const [equivalence, setEquivalence] = useState<FoodItem | null>(null);
  const closeEquivalence = useCallback(() => setEquivalence(null), []);
  const [savedProduct, setSavedProduct] = useState<FoodItem | null>(null);
  async function saveProduct(food: FoodItem) {
    const saved = await onSave(food);
    if (saved) {
      setSavedProduct(food);
      if (plan?.enabled && onSaveEquivalence && onSuggestEquivalence)
        setEquivalence(food);
    }
    return saved;
  }
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductDraft[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    draft: ProductDraft;
    food?: FoodItem;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    []
  );
  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (searching || reviewing) return;
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 18000);
    setSearching(true);
    setError(null);
    setResults(null);
    try {
      const products = await searchProducts(query, controller.signal);
      if (!controller.signal.aborted) setResults(products);
    } catch (failure) {
      if (active.current === controller)
        setError(
          failure instanceof Error
            ? failure.message
            : 'No se pudo buscar. Puedes agregar el producto manualmente.'
        );
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setSearching(false);
      }
    }
  }
  async function review(product: ProductDraft) {
    if (!product.barcode || reviewing || searching) return;
    const existing = foods.find((food) => food.barcode === product.barcode);
    if (existing) {
      setEditor({ food: existing, draft: productToDraft(existing) });
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 18000);
    setReviewing(product.barcode);
    setError(null);
    try {
      const current = await searchProducts(product.barcode, controller.signal);
      if (!controller.signal.aborted) {
        const found = current.find((item) => item.barcode === product.barcode);
        setEditor({
          draft: found ?? {
            ...product,
            warnings: [
              'No se encontró una ficha vigente. Completa los valores con tu etiqueta antes de guardar.',
            ],
          },
        });
      }
    } catch (failure) {
      if (active.current === controller)
        setEditor({
          draft: {
            ...product,
            warnings: [
              failure instanceof Error
                ? failure.message
                : 'No se pudo cargar la ficha. Completa los datos desde la etiqueta.',
            ],
          },
        });
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setReviewing(null);
      }
    }
  }
  async function remove(id: string) {
    setDeleting(true);
    setError(null);
    try {
      if (await onDelete(id)) setDeleteId(null);
      else
        setError(
          'No se pudo confirmar la eliminación. Actualiza tus registros antes de reintentar.'
        );
    } catch {
      setError('No se pudo eliminar el producto. Revisa tu conexión.');
    } finally {
      setDeleting(false);
    }
  }
  const filtered = foods.filter((food) =>
    `${food.name} ${food.brand ?? ''} ${food.barcode ?? ''}`
      .toLocaleLowerCase('es')
      .includes(filter.toLocaleLowerCase('es'))
  );
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mis productos</h2>
        <p className="mt-2 text-slate-400">
          Tu catálogo personal de productos habituales, guardado en tu cuenta.
          Después podrás elegirlos al agregar alimentos al diario.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Al guardar, podrás definir su equivalencia con tu pauta y pedir ayuda
          para comparar referencias. También puedes completarla después desde
          cada producto; sus macros se conservan por separado.
        </p>
      </div>
      {savedProduct && !plan?.enabled && (
        <div
          role="status"
          className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-200"
        >
          <p>
            {savedProduct.name} está guardado con sus nutrientes. La
            equivalencia queda pendiente hasta configurar o activar tu pauta.
          </p>
          <button
            onClick={onOpenPlan}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Configurar pauta para este producto
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          disabled={searching || !!reviewing}
          onClick={() => setEditor({ draft: emptyProduct() })}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-4 font-bold text-slate-950"
        >
          <PackagePlus className="h-5 w-5" />
          Ingresar producto manualmente
        </button>
        <button
          disabled={searching || !!reviewing}
          onClick={() => setEditor({ draft: emptyProduct() })}
          className="flex items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-950/30 px-4 py-4 font-semibold text-teal-300"
        >
          <Camera className="h-5 w-5" />
          Leer tabla nutricional con IA
        </button>
      </div>
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold">Buscar un producto</h3>
        <p className="mt-1 text-sm text-slate-400">
          Busca por nombre o escribe el código de barras. Si no aparece,
          ingrésalo manualmente o fotografía su tabla nutricional.
        </p>
        <form
          onSubmit={search}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            aria-label="Nombre o código de barras"
            required
            minLength={2}
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej.: mayonesa Kraft o código de barras"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3"
          />
          <button
            disabled={searching || !!reviewing}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-emerald-300 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {searching ? 'Buscando…' : 'Buscar en Open Food Facts'}
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Al buscar, se consulta Open Food Facts. Datos comunitarios: revisa la
          variedad, unidad y etiqueta antes de guardar.{' '}
          <a
            className="text-emerald-300 underline"
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Food Facts
          </a>{' '}
          · ODbL / DBCL.
        </p>
        {searching && (
          <p role="status" className="mt-3 text-sm text-slate-400">
            Consultando el catálogo…
          </p>
        )}
        {results?.length === 0 && (
          <p role="status" className="mt-4 text-amber-300">
            No encontramos ese producto. Usa el ingreso manual o la foto de la
            etiqueta.
          </p>
        )}
        {!!results?.length && (
          <ul className="mt-4 space-y-3">
            {results.map((product) => {
              const existing = foods.find(
                (food) => food.barcode === product.barcode
              );
              return (
                <li
                  key={product.barcode}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 p-3"
                >
                  <div>
                    <p className="font-semibold">
                      {product.name || 'Producto sin nombre'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {product.brand} · {product.barcode}
                    </p>
                    <p className="text-xs text-slate-400">
                      Los valores de la ficha se cargarán al revisar.
                    </p>
                  </div>
                  <button
                    disabled={!!reviewing || searching}
                    onClick={() => void review(product)}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-emerald-300"
                  >
                    {reviewing === product.barcode
                      ? 'Cargando ficha…'
                      : existing
                      ? 'Editar mi producto'
                      : 'Revisar e importar'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-950/30 p-4 text-rose-300">
          {error}
        </p>
      )}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            Mi catálogo ({foods.length})
          </h3>
          <button
            onClick={onOpenPlan}
            className="text-sm font-semibold text-emerald-300"
          >
            Configurar equivalencias en Mi pauta
          </button>
        </div>
        <label className="mt-4 block text-sm text-slate-300">
          Filtrar mis productos
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3"
            placeholder="Nombre, marca o código"
          />
        </label>
        {!foods.length ? (
          <p className="mt-5 text-slate-400">
            Aún no tienes productos personales. Agrega el primero con sus
            valores nutricionales.
          </p>
        ) : !filtered.length ? (
          <p className="mt-5 text-slate-400">
            No hay productos que coincidan con el filtro.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {filtered.map((food) => {
              const rule = plan
                ? findPautaRule(plan, food.id, food.name)
                : undefined;
              return (
                <li
                  key={food.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <h4 className="font-semibold">{food.name}</h4>
                  {food.brand && (
                    <p className="text-sm text-slate-400">{food.brand}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Por {food.servingSizeGrams}{' '}
                    {QUANTITY_LABELS[food.quantityUnit ?? 'g']}
                  </p>
                  <p className="mt-1 text-sm">
                    {food.calories} kcal · P {food.protein} g · C {food.carbs} g
                    · G {food.fat} g
                  </p>
                  {food.barcode && (
                    <p className="mt-1 text-xs text-slate-500">
                      Código: {food.barcode}
                    </p>
                  )}
                  {food.productSource?.kind === 'open_food_facts' && (
                    <a
                      href={food.productSource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs text-emerald-300 underline"
                    >
                      Fuente: Open Food Facts · ODbL / DBCL
                    </a>
                  )}
                  <p
                    className={`mt-3 text-xs ${
                      rule ? 'text-emerald-200' : 'text-amber-200'
                    }`}
                  >
                    {rule
                      ? `${rule.referenceAmount} ${
                          QUANTITY_LABELS[rule.unit]
                        } → ${
                          rule.free
                            ? 'Libre según mi pauta'
                            : rule.contributions
                                .map(
                                  (item) =>
                                    `${formatPortions(item.portions)} ${
                                      PAUTA_LABELS[item.group]
                                    }`
                                )
                                .join(' + ')
                        }`
                      : 'Equivalencia pendiente'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {onSaveEquivalence && onSuggestEquivalence && (
                      <button
                        type="button"
                        onClick={() => setEquivalence(food)}
                        aria-label={`Configurar equivalencia de ${food.name}`}
                        className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200"
                      >
                        {rule ? 'Ver equivalencia' : 'Definir equivalencia'}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setEditor({ food, draft: productToDraft(food) })
                      }
                      className="text-sm font-semibold text-emerald-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(food.id)}
                      className="text-sm text-slate-400"
                    >
                      Eliminar
                    </button>
                  </div>
                  {deleteId === food.id && (
                    <div className="mt-3 space-y-2 border-t border-slate-700 pt-3 text-sm">
                      <p>
                        ¿Eliminar del catálogo? Tus comidas y combos guardados
                        conservan sus valores.
                      </p>
                      <button
                        disabled={deleting}
                        onClick={() => void remove(food.id)}
                        className="mr-4 text-rose-300"
                      >
                        Sí, eliminar producto
                      </button>
                      <button
                        disabled={deleting}
                        onClick={() => setDeleteId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {equivalence && onSaveEquivalence && onSuggestEquivalence && (
        <ProductEquivalenceModal
          food={equivalence}
          plan={plan}
          onSave={onSaveEquivalence}
          onSuggest={onSuggestEquivalence}
          onClose={closeEquivalence}
          onOpenPlan={() => {
            closeEquivalence();
            onOpenPlan();
          }}
        />
      )}
      {editor && (
        <ProductEditor
          initial={editor.draft}
          food={editor.food}
          foods={foods}
          onSave={saveProduct}
          onClose={() => setEditor(null)}
        />
      )}
    </section>
  );
}
