import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Utensils,
  ClipboardCheck,
  Compass,
  Plus,
  Scale,
} from 'lucide-react';
import {
  FoodItem,
  MacroGoals,
  MealEntry,
  MealType,
  NutritionPlan,
  PAUTA_LABELS,
  PautaGroup,
  QUANTITY_LABELS,
  formatPortions,
} from '../../types/nutrition';
import {
  buildFoodGuide,
  FoodGuide,
  FoodIdea,
  NUTRIENT_KEYS,
  NUTRIENT_LABELS,
  Nutrients,
} from './food-guide';
import { RegisterFoodIdeaModal } from './RegisterFoodIdeaModal';
import { FoodIdeaImpact } from './FoodIdeaImpact';

const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const unit = (key: keyof Nutrients) => (key === 'calories' ? 'kcal' : 'g');
const amount = (value: number, key: keyof Nutrients) =>
  `${number.format(value)} ${unit(key)}`;
const style = {
  calories: 'text-slate-100',
  protein: 'text-emerald-300',
  carbs: 'text-amber-300',
  fat: 'text-rose-300',
};

export function FoodGuideShortcut({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-400/25 bg-gradient-to-r from-teal-400/10 to-slate-900 p-4">
      <div className="flex items-center gap-3">
        <Compass className="size-6 shrink-0 text-teal-300" aria-hidden="true" />
        <div>
          <h3 className="font-semibold">¿Qué puedo comer?</h3>
          <p className="mt-1 text-xs text-slate-400">
            Ideas según tus macros restantes y los grupos pendientes de tu
            pauta.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 items-center gap-2 rounded-xl bg-teal-400/15 px-4 text-sm font-semibold text-teal-200 hover:bg-teal-400/25"
      >
        Ver opciones
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </section>
  );
}

function IdeaCard({
  idea,
  onRegister,
  onOpenProducts,
}: {
  idea: FoodIdea;
  onRegister: (id: string) => void;
  onOpenProducts: () => void;
}) {
  return (
    <article
      aria-label={`Opción: ${idea.name}`}
      className="min-w-0 space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="line-clamp-2 text-sm font-semibold" title={idea.name}>
            {idea.name}
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            {idea.quantity
              ? `${number.format(idea.quantity.amount)} ${
                  QUANTITY_LABELS[idea.quantity.unit]
                }`
              : 'Cantidad libre según tu pauta'}
            <span className="mx-1.5">·</span>
            {idea.source === 'personal'
              ? 'Mi producto'
              : idea.source === 'catalog'
              ? 'Catálogo base · valores de referencia'
              : 'Referencia de mi pauta'}
          </p>
        </div>
        {idea.food && idea.quantity && (
          <button
            type="button"
            onClick={() => onRegister(idea.id)}
            aria-label={`Revisar y registrar ${idea.name}`}
            title="Revisar y registrar"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-200 hover:bg-teal-400/20"
          >
            <Plus className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {idea.nutrients ? (
        <dl className="grid grid-cols-4 gap-2">
          {NUTRIENT_KEYS.map((key) => (
            <div key={key}>
              <dt className="text-[10px] text-slate-500">
                {key === 'carbs' ? 'Carbos' : NUTRIENT_LABELS[key]}
              </dt>
              <dd
                className={`mt-0.5 text-xs font-semibold tabular-nums ${style[key]}`}
              >
                {amount(idea.nutrients![key], key)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="rounded-lg bg-slate-900 p-2.5 text-xs leading-5 text-slate-400">
          Tiene equivalencia de pauta, pero falta una ficha nutricional
          compatible para comparar macros.
          <button
            type="button"
            onClick={onOpenProducts}
            className="mt-1 block min-h-9 font-semibold text-teal-300 underline underline-offset-2"
          >
            Completar en Mis productos
          </button>
        </div>
      )}
      <FoodIdeaImpact idea={idea} />
      {idea.detail && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer py-1 text-slate-400">
            Ver referencia de cantidad
          </summary>
          <p className="mt-1 leading-5">{idea.detail}</p>
        </details>
      )}
    </article>
  );
}

function MacroBalance({ guide }: { guide: FoodGuide }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {NUTRIENT_KEYS.map((key) => (
        <div
          key={key}
          className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
        >
          <dt className="text-xs text-slate-400">{NUTRIENT_LABELS[key]}</dt>
          <dd className={`mt-1 text-xl font-bold tabular-nums ${style[key]}`}>
            {amount(guide.remaining[key], key)}
            <span className="mt-1 block text-[11px] font-normal text-slate-400">
              por completar
            </span>
          </dd>
          <dd className="mt-3 text-xs leading-5 text-slate-400">
            Llevas {amount(guide.consumed[key], key)}
            <br />
            Meta {amount(guide.goals[key], key)}
          </dd>
          {guide.exceeded[key] > 1e-7 && (
            <dd className="mt-2 text-xs text-amber-200">
              {amount(guide.exceeded[key], key)} sobre la meta
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

export function FoodGuideView({
  date,
  goals,
  meals,
  foods,
  plan,
  onOpenPlan,
  onOpenProducts,
  onOpenDiary,
  onAddMeal,
}: {
  date: string;
  goals: MacroGoals;
  meals: MealEntry[];
  foods: FoodItem[];
  plan?: NutritionPlan | null;
  onOpenPlan: () => void;
  onOpenProducts: () => void;
  onOpenDiary: () => void;
  onAddMeal: (
    type: MealType,
    food: FoodItem,
    amount: number
  ) => Promise<boolean>;
}) {
  const guide = useMemo(
    () => buildFoodGuide({ goals, meals, foods, plan }),
    [goals, meals, foods, plan]
  );
  const [mode, setMode] = useState<'macros' | 'pauta'>('macros');
  const [group, setGroup] = useState<PautaGroup | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const needs = guide.groups.filter(
    (item) =>
      (item.remaining !== null && item.remaining > 1e-7) ||
      (item.group === 'veggies' &&
        item.target === null &&
        item.consumed === 0 &&
        item.freeRecords === 0 &&
        item.ideas.length > 0)
  );
  const ordered = [...needs].sort(
    (a, b) =>
      Number(a.consumed > 0 || a.freeRecords > 0) -
        Number(b.consumed > 0 || b.freeRecords > 0) ||
      [
        'veggies',
        'fruits',
        'dairy',
        'protein',
        'carbs',
        'fats',
        'supplements',
      ].indexOf(a.group) -
        [
          'veggies',
          'fruits',
          'dairy',
          'protein',
          'carbs',
          'fats',
          'supplements',
        ].indexOf(b.group)
  );
  const activeGroup =
    group !== 'all' && ordered.some((item) => item.group === group)
      ? group
      : 'all';
  const visibleGroups =
    activeGroup === 'all'
      ? ordered
      : ordered.filter((item) => item.group === activeGroup);
  const selectedIdea = [
    ...guide.macroIdeas,
    ...guide.groups.flatMap((item) => item.ideas),
  ].find((idea) => idea.id === selected);
  const macrosCovered = NUTRIENT_KEYS.every(
    (key) => guide.remaining[key] <= 1e-7
  );
  const biggestGap = (['protein', 'carbs', 'fat'] as const)
    .filter((key) => guide.remaining[key] > 1e-7)
    .sort(
      (a, b) =>
        guide.remaining[b] / Math.max(1, guide.goals[b]) -
        guide.remaining[a] / Math.max(1, guide.goals[a])
    )[0];
  const missingVariety = needs.filter(
    (item) =>
      ['fruits', 'dairy', 'veggies'].includes(item.group) &&
      item.consumed === 0 &&
      item.freeRecords === 0
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span title="Se actualiza con los registros guardados, sin llamadas a IA.">
          Con tus registros · sin IA
        </span>
        <button
          type="button"
          onClick={onOpenDiary}
          className="min-h-10 text-teal-300 underline underline-offset-2"
        >
          Volver al diario
        </button>
      </div>
      {macrosCovered && missingVariety.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100"
        >
          Macros y energía cubiertos. Sin registros clasificados de{' '}
          {missingVariety
            .map((item) => PAUTA_LABELS[item.group].toLocaleLowerCase('es'))
            .join(', ')}
          .
        </div>
      )}
      {guide.pending > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-6 text-amber-200"
        >
          Hay {guide.pending} alimento(s) pendiente(s) de clasificar. El
          análisis de porciones es parcial: que un grupo aparezca pendiente no
          confirma que no lo hayas comido.
          <button
            type="button"
            onClick={onOpenDiary}
            className="mt-2 block min-h-9 font-semibold underline underline-offset-2"
          >
            Revisar clasificación en el diario
          </button>
        </div>
      )}
      <div
        role="tablist"
        aria-label="Tipo de análisis"
        className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 p-1.5"
      >
        {(
          [
            ['macros', 'Según mis macros', Scale],
            ['pauta', 'Según mi pauta', ClipboardCheck],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`food-guide-tab-${id}`}
            aria-selected={mode === id}
            aria-controls={`food-guide-panel-${id}`}
            tabIndex={mode === id ? 0 : -1}
            onKeyDown={(event) => {
              if (
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 'macros'
                    : event.key === 'End'
                    ? 'pauta'
                    : mode === 'macros'
                    ? 'pauta'
                    : 'macros';
                setMode(next);
                document.getElementById(`food-guide-tab-${next}`)?.focus();
              }
            }}
            onClick={() => setMode(id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition ${
              mode === id
                ? 'bg-teal-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`food-guide-panel-${mode}`}
        aria-labelledby={`food-guide-tab-${mode}`}
        className="space-y-5"
      >
        {mode === 'macros' ? (
          <>
            <div>
              <h3 className="text-lg font-semibold">
                Lo que queda de tus macros
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Registros de la fecha elegida y tus metas guardadas actuales.
                Las porciones se revisan en la otra pestaña.
              </p>
            </div>
            <MacroBalance guide={guide} />
            <p className="text-sm leading-6 text-slate-300">
              {biggestGap
                ? `Tu mayor margen proporcional está en ${NUTRIENT_LABELS[
                    biggestGap
                  ].toLocaleLowerCase('es')}: ${amount(
                    guide.remaining[biggestGap],
                    biggestGap
                  )} por completar.`
                : 'Tus objetivos de proteínas, carbohidratos y grasas están cubiertos.'}
            </p>
            <div>
              <h3 className="font-semibold">Ideas que caben en tus márgenes</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Cada opción es una alternativa por separado. Compara antes de
                combinar varias.
              </p>
            </div>
            {guide.macroIdeas.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {guide.macroIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onRegister={setSelected}
                    onOpenProducts={onOpenProducts}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm leading-6 text-slate-300">
                {macrosCovered
                  ? 'Tus objetivos numéricos están cubiertos. Revisa los grupos pendientes en «Según mi pauta».'
                  : 'No encontramos una porción del catálogo que quepa en todos los márgenes restantes. Revisa la pauta o completa más fichas en Mis productos.'}
                <button
                  type="button"
                  onClick={() => setMode('pauta')}
                  className="mt-2 block min-h-10 font-semibold text-teal-300"
                >
                  Ver análisis de mi pauta
                </button>
              </div>
            )}
          </>
        ) : !guide.plan ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold">Configura tu pauta para este día</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Necesitas una pauta activa y aplicable a la fecha elegida, con
              metas y equivalencias. El análisis de macros ya está disponible.
            </p>
            <button
              type="button"
              onClick={onOpenPlan}
              className="mt-4 min-h-11 rounded-xl bg-teal-400 px-4 text-sm font-bold text-slate-950"
            >
              Configurar mi pauta
            </button>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold">
                Lo que queda de tu pauta
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {guide.plan.name} · versión {guide.plan.version} del diario.
              </p>
            </div>
            <details className="rounded-xl border border-slate-800 bg-slate-900/40 px-3">
              <summary className="cursor-pointer py-3 text-xs font-semibold text-slate-300">
                Ver avance de todos los grupos
              </summary>
              <p className="mb-3 text-xs leading-5 text-slate-400">
                Las porciones siguen tus equivalencias; los gramos de nutrientes
                se cuentan por separado.
              </p>
              <dl className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-3">
                {guide.groups.map((item) => (
                  <div
                    key={item.group}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <dt className="text-xs text-slate-400">
                      {PAUTA_LABELS[item.group]}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {item.target === null
                        ? 'Libre / sin meta'
                        : `${formatPortions(item.consumed)} / ${formatPortions(
                            item.target
                          )}`}
                    </dd>
                    <dd className="mt-1 text-xs text-slate-400">
                      {item.target === null
                        ? item.group === 'veggies' && item.ideas.length > 0
                          ? `${item.freeRecords} registro(s) libres identificados`
                          : 'Sin cantidad pendiente definida'
                        : item.remaining! > 1e-7
                        ? `Faltan ${formatPortions(item.remaining!)} porciones`
                        : item.consumed > item.target
                        ? `${formatPortions(
                            item.consumed - item.target
                          )} sobre tu pauta`
                        : item.target === 0
                        ? 'Sin porciones previstas'
                        : 'Objetivo cubierto'}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
            {needs.some((item) => item.remaining !== null) && (
              <p className="text-sm leading-6 text-slate-300">
                Según lo clasificado, faltan:{' '}
                {needs
                  .filter((item) => item.remaining !== null)
                  .map(
                    (item) =>
                      `${formatPortions(item.remaining!)} ${PAUTA_LABELS[
                        item.group
                      ].toLocaleLowerCase('es')}`
                  )
                  .join(' · ')}
                .
              </p>
            )}
            {needs.length > 0 ? (
              <>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Filtrar ideas de pauta"
                >
                  {(['all', ...ordered.map((item) => item.group)] as const).map(
                    (key) => (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={activeGroup === key}
                        onClick={() => setGroup(key)}
                        className={`min-h-10 rounded-xl border px-3 text-xs font-semibold ${
                          activeGroup === key
                            ? 'border-teal-400/40 bg-teal-400/15 text-teal-200'
                            : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {key === 'all'
                          ? 'Todo lo pendiente'
                          : PAUTA_LABELS[key]}
                      </button>
                    )
                  )}
                </div>
                <p className="text-xs leading-5 text-slate-400">
                  Una opción por grupo para empezar; filtra un grupo para
                  comparar alternativas. Son ejemplos independientes, no una
                  comida que debas sumar completa. «Libre» no significa cero
                  calorías.
                </p>
                <div
                  className={`grid gap-4 ${
                    activeGroup === 'all' ? 'lg:grid-cols-3' : ''
                  }`}
                >
                  {visibleGroups.map((item) => (
                    <section key={item.group} className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <Utensils
                          className="size-4 text-teal-300"
                          aria-hidden="true"
                        />
                        {PAUTA_LABELS[item.group]}
                        <span className="font-normal text-slate-400">
                          {item.remaining === null
                            ? '· libre según tu pauta'
                            : `· ${formatPortions(
                                item.remaining
                              )} por completar`}
                        </span>
                      </h4>
                      {item.ideas.length ? (
                        <div
                          className={`grid gap-3 ${
                            activeGroup === 'all' ? '' : 'lg:grid-cols-3'
                          }`}
                        >
                          {item.ideas
                            .slice(0, activeGroup === 'all' ? 1 : 3)
                            .map((idea) => (
                              <IdeaCard
                                key={idea.id}
                                idea={idea}
                                onRegister={setSelected}
                                onOpenProducts={onOpenProducts}
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
                          Faltan referencias de{' '}
                          {PAUTA_LABELS[item.group].toLocaleLowerCase('es')}{' '}
                          para ofrecer ejemplos.
                          <button
                            type="button"
                            onClick={onOpenPlan}
                            className="mt-2 block min-h-9 font-semibold text-teal-300"
                          >
                            Agregar equivalencia en Mi pauta
                          </button>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4 text-sm leading-6 text-teal-100">
                Las metas de porciones registradas están cubiertas. Puedes
                revisar sus cantidades en el diario.
              </div>
            )}
          </>
        )}
      </div>
      {selectedIdea?.food && selectedIdea.quantity && (
        <RegisterFoodIdeaModal
          key={selectedIdea.id}
          date={date}
          idea={selectedIdea}
          guide={guide}
          onAdd={onAddMeal}
          onClose={close}
        />
      )}
    </section>
  );
}
