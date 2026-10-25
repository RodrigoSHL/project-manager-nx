import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import {
  FoodItem,
  ProductDraft,
  QUANTITY_LABELS,
  QuantityUnit,
  foodSchema,
} from '../types/nutrition';
import { readProductLabel } from '../utils/productApi';
import { useSaveAction } from '../hooks/useSaveAction';
import { ProductSources } from './ProductSources';

export const emptyProduct = (): ProductDraft => ({
  name: null,
  brand: null,
  barcode: null,
  referenceAmount: 100,
  referenceUnit: 'g',
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  warnings: [],
  source: { kind: 'manual' },
});
export function productToDraft(food: FoodItem): ProductDraft {
  return {
    name: food.name,
    brand: food.brand ?? null,
    barcode: food.barcode ?? null,
    referenceAmount: food.servingSizeGrams,
    referenceUnit: food.quantityUnit ?? 'g',
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber ?? null,
    warnings: [],
    source: food.productSource ?? { kind: 'manual' },
  };
}
const inputClass =
  'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100';
const nutrientFields = [
  ['calories', 'Energía (kcal)'],
  ['protein', 'Proteínas (g)'],
  ['carbs', 'Carbohidratos (g)'],
  ['fat', 'Grasas totales (g)'],
  ['fiber', 'Fibra (g, opcional)'],
] as const;
type NumericField = (typeof nutrientFields)[number][0] | 'referenceAmount';

export function ProductEditor({
  initial = emptyProduct(),
  food,
  foods = [],
  onSave,
  onClose,
}: {
  initial?: ProductDraft;
  food?: FoodItem;
  foods?: FoodItem[];
  onSave: (food: FoodItem) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        [...nutrientFields.map(([key]) => key), 'referenceAmount'].map(
          (key) => [
            key,
            initial[key as NumericField] == null
              ? ''
              : String(initial[key as NumericField]),
          ]
        )
      ) as Record<NumericField, string>
  );
  const [category, setCategory] = useState<FoodItem['category']>(
    food?.category ?? 'custom'
  );
  const [notes, setNotes] = useState(food?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [id] = useState(() => food?.id ?? crypto.randomUUID());
  const active = useRef<AbortController | null>(null);
  const { save, saveError } = useSaveAction();
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    []
  );
  const duplicate = draft.barcode
    ? foods.find(
        (item) => item.id !== id && item.barcode === draft.barcode?.trim()
      )
    : undefined;
  const update = (key: keyof ProductDraft, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setReviewed(false);
  };

  async function read(file: File) {
    const controller = new AbortController();
    active.current?.abort();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setReading(true);
    setError(null);
    try {
      const result = await readProductLabel(file, controller.signal);
      if (controller.signal.aborted) return;
      setDraft((old) => ({
        ...result,
        name: result.name ?? old.name,
        brand: result.brand ?? old.brand,
        barcode: result.barcode ?? old.barcode,
        // Preserve OFF attribution when the label fills an imported draft.
        source:
          old.source.kind === 'open_food_facts' ||
          old.source.kind === 'web_search'
            ? old.source
            : result.source,
      }));
      setValues(
        Object.fromEntries(
          [...nutrientFields.map(([key]) => key), 'referenceAmount'].map(
            (key) => [
              key,
              result[key as NumericField] == null
                ? ''
                : String(result[key as NumericField]),
            ]
          )
        ) as Record<NumericField, string>
      );
      setReviewed(false);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : 'No se pudo leer la etiqueta.'
        );
      else if (active.current === controller)
        setError(
          'La lectura tardó demasiado. Puedes completar los datos manualmente.'
        );
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setReading(false);
      }
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (duplicate) {
      setError(
        'Ya tienes un producto con ese código. Edita el existente desde Mis productos.'
      );
      return;
    }
    const numbers = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value.trim() ? Number(value) : undefined,
      ])
    );
    const result = foodSchema.safeParse({
      ...food,
      id,
      name: draft.name?.trim(),
      ...(draft.brand?.trim()
        ? { brand: draft.brand.trim() }
        : { brand: undefined }),
      barcode: draft.barcode?.trim() || undefined,
      servingSizeGrams: numbers.referenceAmount,
      quantityUnit: draft.referenceUnit ?? undefined,
      servingUnit: `${values.referenceAmount} ${
        draft.referenceUnit ? QUANTITY_LABELS[draft.referenceUnit] : ''
      }`,
      calories: numbers.calories,
      protein: numbers.protein,
      carbs: numbers.carbs,
      fat: numbers.fat,
      fiber: numbers.fiber,
      category,
      notes: notes.trim() || undefined,
      isCustom: true,
      productSource: draft.source,
    });
    if (!result.success || !draft.referenceUnit) {
      setError(
        'Completa nombre, cantidad, unidad, calorías y los tres macros con números válidos. Usa 0 solo cuando la etiqueta indique cero.'
      );
      return;
    }
    if (!reviewed) {
      setError('Confirma que revisaste los datos antes de guardar.');
      return;
    }
    setSubmitting(true);
    await save(() => onSave(result.data as FoodItem), onClose);
    setSubmitting(false);
  }
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-editor-title"
    >
      <section className="mx-auto my-4 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="product-editor-title" className="text-xl font-bold">
              {food ? 'Editar producto' : 'Revisar y guardar producto'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Se guarda en tu cuenta para usarlo en el diario y tus combos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar producto"
            className="p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="my-5 rounded-xl border border-teal-800 bg-teal-950/20 p-4 text-sm">
          <p>
            ¿Tienes la etiqueta? Fotografía la tabla completa y sus encabezados.
            Se enviará a Gemini al elegir una imagen. La lectura reemplaza los
            valores del formulario; podrás corregirlos antes de guardar.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              {
                capture: true,
                label: 'Tomar foto de la etiqueta',
                Icon: Camera,
              },
              {
                capture: false,
                label: 'Elegir etiqueta de la galería',
                Icon: Upload,
              },
            ].map(({ capture, label, Icon }) => (
              <label
                key={label}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 font-semibold text-emerald-300"
              >
                <Icon className="h-4 w-4" />
                {label}
                <input
                  aria-label={label}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  {...(capture ? { capture: 'environment' as const } : {})}
                  disabled={reading || submitting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void read(file);
                  }}
                />
              </label>
            ))}
          </div>
          {reading && (
            <p role="status" className="mt-3 text-emerald-300">
              Leyendo etiqueta…
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            JPEG, PNG o WebP · máximo 5 MB. La foto no se guarda en el catálogo.
          </p>
        </div>
        {(error || saveError) && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-rose-950/40 p-3 text-sm text-rose-300"
          >
            {error || saveError}
          </p>
        )}
        {draft.warnings.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm text-amber-300">
            {draft.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={reading || submitting} className="space-y-4">
            <label className="block text-sm">
              Nombre del producto
              <input
                required
                maxLength={200}
                value={draft.name ?? ''}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Marca (opcional)
                <input
                  maxLength={150}
                  value={draft.brand ?? ''}
                  onChange={(e) => update('brand', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                Código de barras (opcional)
                <input
                  inputMode="numeric"
                  pattern="[0-9]{8,14}"
                  maxLength={14}
                  value={draft.barcode ?? ''}
                  onChange={(e) => update('barcode', e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            {duplicate && (
              <p role="alert" className="text-sm text-amber-300">
                Este código ya está guardado como {duplicate.name}. Cierra y
                edita ese producto.
              </p>
            )}
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <p className="mb-3 text-sm text-slate-300">
                Todos los valores siguientes corresponden a esta misma cantidad
                base, tal como aparecen en la etiqueta.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  Cantidad base
                  <input
                    type="number"
                    required
                    min="0.01"
                    max="20000"
                    step="any"
                    value={values.referenceAmount}
                    onChange={(e) => {
                      setValues({ ...values, referenceAmount: e.target.value });
                      setReviewed(false);
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm">
                  Unidad
                  <select
                    required
                    value={draft.referenceUnit ?? ''}
                    onChange={(e) =>
                      update('referenceUnit', e.target.value as QuantityUnit)
                    }
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Selecciona la unidad
                    </option>
                    {Object.entries(QUANTITY_LABELS).map(([unit, label]) => (
                      <option key={unit} value={unit}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Ejemplo: si la tabla dice por 100 g, escribe 100 y gramos. La
                cantidad que comiste se elige después en el diario. No se
                convierten gramos y ml automáticamente.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {nutrientFields.map(([key, label]) => (
                  <label key={key} className="text-sm">
                    {label}
                    <input
                      type="number"
                      required={key !== 'fiber'}
                      min="0"
                      max={key === 'calories' ? 100000 : 20000}
                      step="any"
                      value={values[key]}
                      onChange={(e) => {
                        setValues({ ...values, [key]: e.target.value });
                        setReviewed(false);
                      }}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              Categoría
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as FoodItem['category'])
                }
                className={inputClass}
              >
                <option value="custom">Otro producto</option>
                <option value="protein">Proteínas</option>
                <option value="carbs">Carbohidratos</option>
                <option value="fats">Grasas</option>
                <option value="dairy">Lácteos</option>
                <option value="fruits_veggies">Frutas y verduras</option>
                <option value="snacks">Snacks</option>
              </select>
            </label>
            <label className="block text-sm">
              Notas (opcional)
              <textarea
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </label>
            <p className="text-sm text-slate-400">
              Las calorías se conservan tal como las ingresas. Este producto no
              define equivalencias de tu pauta; se configuran en Mi pauta.
              Editarlo no modifica comidas anteriores.
            </p>
            {draft.source.kind === 'open_food_facts' && (
              <p className="text-xs text-slate-400">
                Fuente:{' '}
                <a
                  href={draft.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 underline"
                >
                  Open Food Facts
                </a>{' '}
                · base ODbL, contenidos DBCL. Revisa los datos con tu envase.
              </p>
            )}
            <ProductSources source={draft.source} />
            <label className="flex items-start gap-2 text-sm">
              <input
                required
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-1"
              />
              Revisé la cantidad base, la unidad, las calorías y los macros.
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!!duplicate}
                className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40"
              >
                {submitting ? 'Guardando…' : 'Guardar producto en mi cuenta'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 text-slate-400"
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
