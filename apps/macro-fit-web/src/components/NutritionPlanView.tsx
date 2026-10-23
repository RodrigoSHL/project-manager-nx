import { useState } from 'react';
import {
  NutritionPlan,
  NutritionPlanInput,
  nutritionPlanInputSchema,
  saveNutritionPlanSchema,
  SaveNutritionPlanInput,
  isNutritionPlanConfigured,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  PautaRule,
  QUANTITY_LABELS,
  FoodItem,
  formatPortions,
} from '../types/nutrition';
import { createPautaTemplate } from '../data/pauta-template';
import { getTodayDateString } from '../hooks/useMacroStore';
import { useSaveAction } from '../hooks/useSaveAction';

const field =
  'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white';

export function NutritionPlanView({
  plan,
  foods,
  onSave,
  onGoToTracker,
}: {
  plan: NutritionPlan | null;
  foods: FoodItem[];
  onSave: (input: SaveNutritionPlanInput) => Promise<boolean>;
  onGoToTracker: () => void;
}) {
  const today = getTodayDateString();
  const [draft, setDraft] = useState<NutritionPlanInput>(() =>
    plan
      ? {
          name: plan.name,
          startsOn: plan.startsOn > today ? plan.startsOn : today,
          enabled: plan.enabled,
          targets: { ...plan.targets },
          waterTargetMl: plan.waterTargetMl,
          waterIsMinimum: plan.waterIsMinimum,
          rules: structuredClone(plan.rules),
        }
      : {
          name: 'Mi pauta',
          startsOn: today,
          enabled: true,
          targets: {
            protein: null,
            carbs: null,
            fats: null,
            dairy: null,
            fruits: null,
            veggies: null,
            supplements: null,
          },
          waterTargetMl: 2000,
          waterIsMinimum: false,
          rules: [],
        }
  );
  const [applyToToday, setApplyToToday] = useState(
    !plan || !isNutritionPlanConfigured(plan)
  );
  const [editing, setEditing] = useState<PautaRule | null>(null);
  const [search, setSearch] = useState('');
  const [validationError, setValidationError] = useState('');
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const { save, saveError } = useSaveAction();
  const commitRule = () => {
    if (!editing) return;
    const candidate = {
      ...draft,
      rules: [...draft.rules.filter((rule) => rule.id !== editing.id), editing],
    };
    const parsed = nutritionPlanInputSchema.safeParse(candidate);
    if (!parsed.success) {
      setValidationError(
        'Revisa el nombre, la cantidad de referencia y los aportes de la equivalencia. Usa cantidades positivas.'
      );
      return;
    }
    setDraft(parsed.data);
    setEditing(null);
    setValidationError('');
  };
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold">Mi pauta</h2>
        <p className="mt-1 text-sm text-slate-400">
          Configura las porciones indicadas en tu pauta. Los gramos de
          nutrientes se mantienen como un conteo independiente.
        </p>
        {plan && (
          <p className="mt-2 text-xs text-emerald-300">
            Versión guardada: {plan.version} · desde {plan.startsOn}
            {!plan.enabled ? ' · desactivada' : ''}
          </p>
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (editing) {
            setValidationError(
              'Guarda o cancela la equivalencia que estás editando antes de guardar la pauta.'
            );
            return;
          }
          const parsed = saveNutritionPlanSchema.safeParse({
            ...draft,
            applyToToday:
              draft.enabled && draft.startsOn === today && applyToToday,
          });
          if (!parsed.success) {
            setValidationError(
              !isNutritionPlanConfigured(draft)
                ? 'Todavía faltan metas o equivalencias. Pulsa Cargar referencia o completa ambos apartados antes de activar la pauta.'
                : 'Revisa las metas y equivalencias: las cantidades deben ser válidas y no puede haber grupos repetidos.'
            );
            return;
          }
          setValidationError('');
          void save(() => onSave(parsed.data), onGoToTracker);
        }}
        className="space-y-5"
      >
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">
              Nombre de la pauta
              <input
                required
                maxLength={150}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={field}
              />
            </label>
            <label className="text-xs text-slate-300">
              Aplicar desde
              <input
                required
                type="date"
                min={today}
                value={draft.startsOn}
                onChange={(e) =>
                  setDraft({ ...draft, startsOn: e.target.value })
                }
                className={field}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
            />{' '}
            Activar seguimiento de porciones
          </label>
          <p className="text-xs text-slate-400">
            Los días anteriores conservan su pauta. Puedes actualizar también
            las porciones de hoy marcando la opción siguiente.
          </p>
          {draft.enabled && draft.startsOn === today && (
            <label className="block rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label="Aplicar también al diario de hoy"
                  checked={applyToToday}
                  onChange={(event) => setApplyToToday(event.target.checked)}
                />
                Aplicar también al diario de hoy
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                Recalcula las porciones de hoy. Conserva tus alimentos,
                cantidades, calorías, nutrientes y agua.
              </span>
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              setDraft(createPautaTemplate(draft.startsOn));
              setEditing(null);
              setTemplateLoaded(true);
              setValidationError('');
            }}
            className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300"
          >
            Cargar referencia de la pauta revisada (10 / 4 / 2 / 3 / 3)
          </button>
          {templateLoaded && (
            <p className="text-xs text-amber-200">
              Referencia editable de las tablas del documento. Para pollo se
              usan 50 g cocidos por porción; un ejemplo del Word dice 100 g y
              requiere confirmación con tu nutricionista. El agua figura como
              más de 2 litros. Revisa las equivalencias antes de guardar.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="font-semibold">Metas diarias de porciones</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PAUTA_GROUPS.map((group) => (
              <div key={group} className="rounded-xl bg-slate-950/60 p-3">
                <label className="block text-xs text-slate-300">
                  {PAUTA_LABELS[group]}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    disabled={draft.targets[group] === null}
                    value={draft.targets[group] ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        targets: {
                          ...draft.targets,
                          [group]: Number(e.target.value),
                        },
                      })
                    }
                    className={field}
                  />
                </label>
                <label className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={draft.targets[group] === null}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        targets: {
                          ...draft.targets,
                          [group]: e.target.checked ? null : 0,
                        },
                      })
                    }
                  />{' '}
                  Libre / sin meta
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">
              Objetivo de agua (ml)
              <input
                required
                type="number"
                min="1"
                max="20000"
                step="1"
                value={draft.waterTargetMl}
                onChange={(e) =>
                  setDraft({ ...draft, waterTargetMl: Number(e.target.value) })
                }
                className={field}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={draft.waterIsMinimum}
                onChange={(e) =>
                  setDraft({ ...draft, waterIsMinimum: e.target.checked })
                }
              />{' '}
              La pauta indica más de esta cantidad
            </label>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">
              Equivalencias por alimento ({draft.rules.length})
            </h3>
            <button
              type="button"
              disabled={draft.rules.length >= 250}
              className="text-sm font-semibold text-emerald-300"
              onClick={() =>
                setEditing({
                  id: crypto.randomUUID(),
                  name: '',
                  foodIds: [],
                  aliases: [],
                  referenceAmount: 1,
                  unit: 'g',
                  contributions: [],
                  free: false,
                  notes: '',
                })
              }
            >
              + Agregar equivalencia
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Una equivalencia puede sumar en varios grupos. Foto y texto solo se
            vinculan automáticamente si el nombre coincide exactamente con un
            nombre alternativo. No se asumen conversiones entre gramos, volumen
            y unidades.
          </p>
          <input
            aria-label="Buscar equivalencias"
            placeholder="Buscar equivalencia…"
            className={field}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {editing && (
            <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-slate-950 p-3">
              <h4 className="text-sm font-semibold">Editar equivalencia</h4>
              <label className="block text-xs">
                Nombre (incluye preparación y marca si corresponde)
                <input
                  maxLength={200}
                  className={field}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs">
                Vincular alimento del catálogo
                <select
                  className={field}
                  value={editing.foodIds[0] ?? ''}
                  onChange={(e) => {
                    const food = foods.find(
                      (item) => item.id === e.target.value
                    );
                    setEditing({
                      ...editing,
                      foodIds: food ? [food.id] : [],
                      name: editing.name || food?.name || '',
                    });
                  }}
                >
                  <option value="">Sin vínculo de catálogo</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Nombres alternativos exactos (uno por línea)
                <textarea
                  className={field}
                  value={editing.aliases.join('\n')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      aliases: e.target.value.split('\n'),
                    })
                  }
                  onBlur={() =>
                    setEditing({
                      ...editing,
                      aliases: editing.aliases
                        .map((name) => name.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">
                  Cantidad de referencia
                  <input
                    type="number"
                    min="0.01"
                    max="20000"
                    step="any"
                    className={field}
                    value={editing.referenceAmount}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        referenceAmount: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="text-xs">
                  Unidad
                  <select
                    className={field}
                    value={editing.unit}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        unit: e.target.value as PautaRule['unit'],
                      })
                    }
                  >
                    {Object.entries(QUANTITY_LABELS).map(([unit, label]) => (
                      <option key={unit} value={unit}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {editing.unit !== 'g' && (
                <label className="block text-xs">
                  Gramos por {QUANTITY_LABELS[editing.unit]} (opcional; solo si
                  conoces la equivalencia)
                  <input
                    type="number"
                    min="0.01"
                    max="20000"
                    step="any"
                    className={field}
                    value={editing.gramsPerUnit ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        gramsPerUnit: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
              )}
              <label className="flex gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={editing.free}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      free: e.target.checked,
                      contributions: e.target.checked
                        ? []
                        : editing.contributions,
                    })
                  }
                />{' '}
                Alimento libre (sin porciones)
              </label>
              {!editing.free && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAUTA_GROUPS.map((group) => (
                    <label key={group} className="text-xs">
                      Aporte a {PAUTA_LABELS[group]}
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="any"
                        className={field}
                        value={
                          editing.contributions.find(
                            (item) => item.group === group
                          )?.portions ?? 0
                        }
                        onChange={(e) => {
                          const portions = Number(e.target.value);
                          setEditing({
                            ...editing,
                            contributions: [
                              ...editing.contributions.filter(
                                (item) => item.group !== group
                              ),
                              ...(portions > 0 ? [{ group, portions }] : []),
                            ],
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
              <label className="block text-xs">
                Preparación y notas
                <textarea
                  maxLength={2000}
                  className={field}
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={commitRule}
                  className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
                >
                  Guardar equivalencia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setValidationError('');
                  }}
                  className="text-xs text-slate-400"
                >
                  Cancelar edición
                </button>
              </div>
            </div>
          )}
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {draft.rules
              .filter((rule) =>
                rule.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-950/70 p-3 text-xs"
                >
                  <div>
                    <p className="font-semibold">{rule.name}</p>
                    <p className="mt-1 text-slate-400">
                      {rule.referenceAmount} {QUANTITY_LABELS[rule.unit]} →{' '}
                      {rule.free
                        ? 'Libre'
                        : rule.contributions
                            .map(
                              (item) =>
                                `${formatPortions(item.portions)} ${
                                  PAUTA_LABELS[item.group]
                                }`
                            )
                            .join(' + ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(structuredClone(rule))}
                      className="text-emerald-300"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          rules: draft.rules.filter(
                            (item) => item.id !== rule.id
                          ),
                        })
                      }
                      className="text-rose-300"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {!draft.rules.length && (
            <p className="text-xs text-amber-300">
              Agrega equivalencias para que los alimentos puedan sumar
              porciones.
            </p>
          )}
        </div>
        {(validationError || saveError) && (
          <p role="alert" className="text-sm text-rose-300">
            {validationError || saveError}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950"
        >
          Guardar pauta en mi cuenta
        </button>
      </form>
    </section>
  );
}
