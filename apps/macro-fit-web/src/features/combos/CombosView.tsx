import { useCallback, useRef, useState } from 'react';
import {
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  FoodItem,
  MealTemplate,
  MealType,
  NutritionPlan,
  QUANTITY_LABELS,
} from '../../types/nutrition';
import {
  previewMealTemplate,
  resolveTemplateFood,
} from '../../utils/mealTemplates';
import { ComboEditor } from './ComboEditor';
import { RegisterComboModal } from './RegisterComboModal';
import { ComboDialog } from './ComboDialog';
import {
  COMBO_MEALS,
  ComboSummary,
  comboInput,
  comboNumber,
} from './ComboSummary';
import { useSaveAction } from '../../hooks/useSaveAction';
import { DiaryDatePicker } from '../../components/DiaryDatePicker';

const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function CombosView({
  templates,
  examples,
  foods,
  date,
  onDateChange,
  plan,
  onSave,
  onDelete,
  onApply,
  onOpenDiary,
  onOpenProducts,
}: {
  templates: MealTemplate[];
  examples: MealTemplate[];
  foods: FoodItem[];
  date: string;
  plan?: NutritionPlan | null;
  onSave: (template: MealTemplate) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onApply: (template: MealTemplate, mealType?: MealType) => Promise<boolean>;
  onOpenDiary: () => void;
  onOpenProducts: () => void;
  onDateChange: (date: string) => void;
}) {
  const [source, setSource] = useState<'mine' | 'examples'>('mine');
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState('all');
  const [editing, setEditing] = useState<{
    template: MealTemplate;
    title: string;
  } | null>(null);
  const [registering, setRegistering] = useState<MealTemplate | null>(null);
  const [removing, setRemoving] = useState<MealTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const { save, saveError } = useSaveAction();
  const closeEditor = useCallback(() => setEditing(null), []);
  const closeRegistration = useCallback(() => setRegistering(null), []);
  const closeRemoval = useCallback(() => setRemoving(null), []);
  function create() {
    setEditing({
      title: 'Crear combo',
      template: {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        mealType: 'breakfast',
        icon: 'utensils',
        items: [],
        isCustom: true,
      },
    });
  }
  function duplicate(template: MealTemplate, example = false) {
    setEditing({
      title: example ? 'Crear combo desde ejemplo' : 'Duplicar combo',
      template: {
        ...structuredClone(template),
        id: crypto.randomUUID(),
        name: `${template.name.slice(0, 142)} (copia)`,
        icon: 'utensils',
        isCustom: true,
      },
    });
  }
  const list = (source === 'mine' ? templates : examples)
    .filter(
      (template) =>
        (meal === 'all' || template.mealType === meal) &&
        normalized(query)
          .trim()
          .split(/\s+/)
          .every((word) =>
            normalized(
              `${template.name} ${template.description} ${template.items
                .map((item) => resolveTemplateFood(item, foods)?.name ?? '')
                .join(' ')}`
            ).includes(word)
          )
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  async function remove() {
    if (!removing || busy.current) return;
    busy.current = true;
    setDeleting(true);
    await save(
      () => onDelete(removing.id),
      () => {
        setMessage('Combo eliminado. Las comidas ya registradas se conservan.');
        closeRemoval();
      }
    );
    busy.current = false;
    setDeleting(false);
  }
  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 tabIndex={-1} data-combos-heading className="text-2xl font-bold">
            Mis combos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Arma tus comidas habituales, revisa sus totales y regístralas sin
            agregar cada alimento otra vez.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DiaryDatePicker
            date={date}
            onChange={onDateChange}
            disabled={false}
          />
          <button
            type="button"
            onClick={create}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950"
          >
            <Plus className="size-4" />
            Crear combo
          </button>
        </div>
      </div>
      {message && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-3 text-sm text-emerald-200"
        >
          <p>{message}</p>
          <button
            type="button"
            onClick={onOpenDiary}
            className="min-h-10 px-2 font-semibold underline"
          >
            Ver en diario
          </button>
        </div>
      )}
      <section
        aria-label="Buscar combos"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
      >
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            aria-pressed={source === 'mine'}
            onClick={() => setSource('mine')}
            className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-400 aria-pressed:border-emerald-400/40 aria-pressed:bg-emerald-400/10 aria-pressed:text-emerald-200"
          >
            Mis combos ({templates.length})
          </button>
          <button
            type="button"
            aria-pressed={source === 'examples'}
            onClick={() => setSource('examples')}
            className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-400 aria-pressed:border-emerald-400/40 aria-pressed:bg-emerald-400/10 aria-pressed:text-emerald-200"
          >
            Ejemplos para empezar
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="relative">
            <span className="sr-only">Buscar combo</span>
            <Search className="pointer-events-none absolute left-3 top-4 size-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, descripción o alimento"
              className={`${comboInput} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Filtrar combos por comida</span>
            <select
              value={meal}
              onChange={(event) => setMeal(event.target.value)}
              className={comboInput}
            >
              <option value="all">Todas las comidas</option>
              {Object.entries(COMBO_MEALS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {list.length} resultado(s) ·{' '}
          {source === 'mine'
            ? 'Guardados en tu cuenta'
            : 'Referencias del catálogo base; crea una copia para personalizarlas.'}
        </p>
      </section>
      {!list.length && (
        <section className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
          <Utensils className="mx-auto mb-3 size-7 text-slate-500" />
          <p className="text-sm font-semibold">
            {templates.length === 0 &&
            source === 'mine' &&
            !query &&
            meal === 'all'
              ? 'Crea tu primer combo'
              : 'No hay combos con esos filtros'}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Puedes partir desde cero, copiar un ejemplo o guardar una comida
            desde el botón de combos del diario.
          </p>
        </section>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((template) => {
          const preview = previewMealTemplate(template, foods);
          return (
            <article
              key={template.id}
              aria-label={`Combo: ${template.name}`}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500">
                    {COMBO_MEALS[template.mealType]} · {template.items.length}{' '}
                    alimentos{source === 'examples' ? ' · Ejemplo' : ''}
                  </p>
                  <h3 className="mt-1 break-words text-base font-bold">
                    {template.name}
                  </h3>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-400">
                  <Utensils className="size-4" />
                </span>
              </div>
              {template.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                  {template.description}
                </p>
              )}
              <div className="my-4 rounded-xl bg-slate-950/50 p-3">
                <ComboSummary preview={preview} />
              </div>
              <details className="mb-4 text-xs text-slate-400">
                <summary className="cursor-pointer">
                  Ver alimentos y cantidades
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {template.items.map((item, index) => (
                    <li
                      key={`${item.foodId}-${index}`}
                      className="flex justify-between gap-3"
                    >
                      <span>
                        {resolveTemplateFood(item, foods)?.name ??
                          item.food?.name ??
                          'Alimento no disponible'}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {comboNumber.format(item.amountGrams)}{' '}
                        {
                          QUANTITY_LABELS[
                            item.quantityUnit ?? item.food?.quantityUnit ?? 'g'
                          ]
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                {source === 'mine' ? (
                  <>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Editar combo: ${template.name}`}
                        title="Editar combo"
                        onClick={() =>
                          setEditing({
                            title: 'Editar combo',
                            template: structuredClone(template),
                          })
                        }
                        className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicar combo: ${template.name}`}
                        title="Duplicar combo"
                        onClick={() => duplicate(template)}
                        className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar combo: ${template.name}`}
                        title="Eliminar combo"
                        onClick={() => setRemoving(template)}
                        className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!preview.complete}
                      onClick={() => setRegistering(template)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 text-xs font-bold text-emerald-200 disabled:opacity-40"
                    >
                      <Zap className="size-4" />
                      Registrar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => duplicate(template, true)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/30 px-3 text-xs font-semibold text-emerald-200"
                  >
                    <Copy className="size-4" />
                    Crear copia
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {editing && (
        <ComboEditor
          key={editing.template.id}
          template={editing.template}
          title={editing.title}
          foods={foods}
          onSave={async (template) => {
            const saved = await onSave(template);
            if (saved) {
              setMessage('Combo guardado en tu cuenta.');
              setSource('mine');
              setQuery('');
              setMeal('all');
            }
            return saved;
          }}
          onClose={closeEditor}
          onOpenProducts={onOpenProducts}
        />
      )}
      {registering && (
        <RegisterComboModal
          template={registering}
          foods={foods}
          date={date}
          plan={plan}
          onApply={async (template, target) => {
            const saved = await onApply(template, target);
            if (saved)
              setMessage(
                `Combo registrado en ${COMBO_MEALS[
                  target ?? template.mealType
                ].toLowerCase()} del ${date}.`
              );
            return saved;
          }}
          onClose={closeRegistration}
        />
      )}
      {removing && (
        <ComboDialog
          title="Eliminar combo"
          subtitle={removing.name}
          busy={deleting}
          onClose={closeRemoval}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={closeRemoval}
                className="min-h-11 px-4 text-sm text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void remove()}
                className="min-h-11 rounded-xl bg-rose-500/15 px-4 text-sm font-semibold text-rose-200"
              >
                {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
              </button>
            </div>
          }
        >
          <p className="text-sm leading-6 text-slate-300">
            Se quitará de tus combos guardados. Las comidas que ya registraste y
            tus productos se conservan.
          </p>
          {saveError && (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {saveError}
            </p>
          )}
        </ComboDialog>
      )}
    </div>
  );
}
