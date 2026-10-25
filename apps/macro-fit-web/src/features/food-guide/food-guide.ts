import {
  calculatePauta,
  findPautaRule,
  FoodItem,
  getNutritionPlanTemplates,
  isNutritionPlanConfigured,
  MacroGoals,
  MealEntry,
  NutritionPlan,
  PAUTA_GROUPS,
  PautaEntrySnapshot,
  PautaGroup,
  PautaRule,
  QuantityUnit,
  summarizePauta,
} from '../../types/nutrition';
import { scaleFoodNutrients as foodNutrients } from '../../utils/food-nutrients';

export const NUTRIENT_KEYS = ['calories', 'protein', 'carbs', 'fat'] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type Nutrients = Record<NutrientKey, number>;
export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  calories: 'Energía',
  protein: 'Proteínas',
  carbs: 'Carbohidratos',
  fat: 'Grasas',
};
export interface FoodIdea {
  id: string;
  name: string;
  food?: FoodItem;
  quantity: { amount: number; unit: QuantityUnit } | null;
  nutrients: Nutrients | null;
  pauta: PautaEntrySnapshot | null;
  macroOverages: Array<{ key: NutrientKey; extra: number }>;
  portionOverages: Array<{ group: PautaGroup; extra: number }>;
  source: 'personal' | 'catalog' | 'plan';
  detail: string;
}
export interface GroupNeed {
  group: PautaGroup;
  consumed: number;
  target: number | null;
  remaining: number | null;
  /** Free foods are records, never invented exchange portions. */
  freeRecords: number;
  ideas: FoodIdea[];
}
export interface FoodGuide {
  goals: Nutrients;
  consumed: Nutrients;
  remaining: Nutrients;
  exceeded: Nutrients;
  macroIdeas: FoodIdea[];
  groups: GroupNeed[];
  plan: NutritionPlan | null;
  pending: number;
}
const EPSILON = 1e-7;
const zero = (): Nutrients => ({ calories: 0, protein: 0, carbs: 0, fat: 0 });

// Free rules have no exchange group in the current data model. Recognize only
// unchanged vegetable references with explicit template metadata; never guess
// that a condiment or a custom free food is a vegetable from its name.
const vegetables = new Map(
  getNutritionPlanTemplates().flatMap((template) =>
    template.entries
      .filter(
        (entry) => entry.section.startsWith('Verduras') && entry.rule.free
      )
      .map((entry) => [entry.rule.id, entry] as const)
  )
);
function vegetableReference(rule: PautaRule) {
  const source = vegetables.get(rule.id);
  return source && rule.free && rule.name === source.rule.name
    ? source
    : undefined;
}
function validFood(food: FoodItem) {
  return (
    Number.isFinite(food.servingSizeGrams) &&
    food.servingSizeGrams > 0 &&
    NUTRIENT_KEYS.every((key) => Number.isFinite(food[key]) && food[key] >= 0)
  );
}
function impacts(
  idea: Omit<FoodIdea, 'macroOverages' | 'portionOverages'>,
  goals: Nutrients,
  consumed: Nutrients,
  plan: NutritionPlan | null,
  portionConsumed: Partial<Record<PautaGroup, number>>
): FoodIdea {
  return {
    ...idea,
    macroOverages: idea.nutrients
      ? NUTRIENT_KEYS.flatMap((key) => {
          const extra =
            Math.max(0, consumed[key] + idea.nutrients![key] - goals[key]) -
            Math.max(0, consumed[key] - goals[key]);
          return extra > EPSILON ? [{ key, extra }] : [];
        })
      : [],
    portionOverages:
      idea.pauta && plan
        ? idea.pauta.contributions.flatMap((item) => {
            const target = plan.targets[item.group];
            if (target === null) return [];
            const before = portionConsumed[item.group] ?? 0;
            const extra =
              Math.max(0, before + item.portions - target) -
              Math.max(0, before - target);
            return extra > EPSILON ? [{ group: item.group, extra }] : [];
          })
        : [],
  };
}

/** Recalculate the preview when the user edits a proposed quantity. */
export function resizeFoodIdea(
  idea: FoodIdea,
  amount: number,
  guide: FoodGuide
): FoodIdea {
  if (
    !idea.food ||
    !idea.quantity ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 20000
  )
    return idea;
  const quantity = { ...idea.quantity, amount };
  const pauta = guide.plan
    ? calculatePauta(
        guide.plan,
        {
          foodId: idea.food.id,
          foodName: idea.food.name,
          amountGrams: amount,
          quantity,
        },
        idea.food.pautaSelection
      )
    : null;
  return impacts(
    { ...idea, quantity, nutrients: foodNutrients(idea.food, amount), pauta },
    guide.goals,
    guide.consumed,
    guide.plan,
    Object.fromEntries(guide.groups.map((item) => [item.group, item.consumed]))
  );
}

export function buildFoodGuide(input: {
  goals: MacroGoals;
  meals: MealEntry[];
  foods: FoodItem[];
  plan?: NutritionPlan | null;
}): FoodGuide {
  const goals = {
    calories: input.goals.calories,
    protein: input.goals.proteinGrams,
    carbs: input.goals.carbsGrams,
    fat: input.goals.fatGrams,
  };
  const consumed = input.meals.reduce((total, meal) => {
    NUTRIENT_KEYS.forEach((key) => {
      total[key] += meal[key];
    });
    return total;
  }, zero());
  const remaining = zero(),
    exceeded = zero();
  NUTRIENT_KEYS.forEach((key) => {
    remaining[key] = Math.max(0, goals[key] - consumed[key]);
    exceeded[key] = Math.max(0, consumed[key] - goals[key]);
  });
  const plan =
    input.plan?.enabled && isNutritionPlanConfigured(input.plan)
      ? input.plan
      : null;
  const summary = plan ? summarizePauta(input.meals, plan) : null;
  const foods = [
    ...new Map(input.foods.map((food) => [food.id, food])).values(),
  ].filter(validFood);
  const linked = new Map<string, FoodItem[]>();
  if (plan)
    for (const food of foods) {
      const rule = findPautaRule(plan, food.id, food.name);
      if (rule) linked.set(rule.id, [...(linked.get(rule.id) ?? []), food]);
    }
  const makeIdea = (
    id: string,
    name: string,
    food: FoodItem | undefined,
    quantity: FoodIdea['quantity'],
    rule?: PautaRule,
    detail = ''
  ): FoodIdea => {
    const nutrients =
      food && quantity ? foodNutrients(food, quantity.amount) : null;
    const pauta =
      plan && quantity && food
        ? calculatePauta(
            plan,
            {
              foodId: food.id,
              foodName: food.name,
              amountGrams: quantity.amount,
              quantity,
            },
            rule ? { ruleId: rule.id } : food.pautaSelection
          )
        : plan && rule
        ? {
            planVersion: plan.version,
            ruleId: rule.id,
            ruleName: rule.name,
            status: rule.free ? ('free' as const) : ('matched' as const),
            contributions:
              rule.free || !quantity
                ? []
                : rule.contributions.map((item) => ({
                    ...item,
                    portions:
                      (item.portions * quantity.amount) / rule.referenceAmount,
                  })),
          }
        : null;
    return impacts(
      {
        id,
        name,
        food: food
          ? {
              ...food,
              ...(rule ? { pautaSelection: { ruleId: rule.id } } : {}),
            }
          : undefined,
        quantity,
        nutrients,
        pauta,
        source: food ? (food.isCustom ? 'personal' : 'catalog') : 'plan',
        detail,
      },
      goals,
      consumed,
      plan,
      summary?.consumed ?? {}
    );
  };

  // A base serving or half a measurable serving. Avoid tiny quantities chosen
  // solely to make a candidate appear to fit; counted items stay whole.
  const ranked = foods
    .flatMap((food) => {
      const unit = food.quantityUnit ?? 'g';
      const factors = unit === 'unit' || unit === 'scoop' ? [1] : [1, 0.5];
      for (const factor of factors) {
        const amount = food.servingSizeGrams * factor;
        const nutrients = foodNutrients(food, amount);
        if (
          !NUTRIENT_KEYS.every(
            (key) => nutrients[key] <= remaining[key] + EPSILON
          ) ||
          !NUTRIENT_KEYS.some((key) => nutrients[key] > EPSILON)
        )
          continue;
        const score =
          (['protein', 'carbs', 'fat'] as const).reduce(
            (sum, key) =>
              sum + (goals[key] > 0 ? nutrients[key] / goals[key] : 0),
            0
          ) +
          (goals.calories > 0
            ? (0.25 * nutrients.calories) / goals.calories
            : 0);
        return [
          {
            idea: makeIdea(`macro:${food.id}`, food.name, food, {
              amount,
              unit,
            }),
            score,
          },
        ];
      }
      return [];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(!!b.idea.food?.isCustom) - Number(!!a.idea.food?.isCustom) ||
        a.idea.name.localeCompare(b.idea.name, 'es')
    );
  const macroIdeas: FoodIdea[] = [];
  const categories = new Set<string>();
  for (const candidate of ranked) {
    const category = candidate.idea.food!.category;
    if (categories.has(category)) continue;
    categories.add(category);
    macroIdeas.push(candidate.idea);
    if (macroIdeas.length === 3) break;
  }
  for (const candidate of ranked) {
    if (macroIdeas.length === 3) break;
    if (!macroIdeas.some((idea) => idea.id === candidate.idea.id))
      macroIdeas.push(candidate.idea);
  }

  const groups: GroupNeed[] =
    plan && summary
      ? PAUTA_GROUPS.map((group) => {
          const target = plan.targets[group];
          const value = summary.consumed[group];
          const remaining =
            target === null ? null : Math.max(0, target - value);
          const freeRules =
            group === 'veggies'
              ? plan.rules.filter((rule) => vegetableReference(rule))
              : [];
          const freeIds = new Set(freeRules.map((rule) => rule.id));
          const freeRecords = input.meals.filter(
            (meal) =>
              meal.pauta?.planVersion === plan.version &&
              meal.pauta.status === 'free' &&
              meal.pauta.ruleId &&
              freeIds.has(meal.pauta.ruleId)
          ).length;
          const rules =
            remaining !== null && remaining > EPSILON
              ? plan.rules.filter(
                  (rule) =>
                    !rule.free &&
                    rule.contributions.some((item) => item.group === group)
                )
              : group === 'veggies' && target === null
              ? freeRules
              : [];
          const ideas = rules
            .map((rule) => {
              const contribution = rule.contributions.find(
                (item) => item.group === group
              );
              const ratio = rule.free
                ? 1
                : Math.min(1, remaining!) / contribution!.portions;
              const ruleAmount = rule.referenceAmount * ratio;
              const matching = (linked.get(rule.id) ?? []).filter(
                (food) =>
                  rule.free ||
                  (food.quantityUnit ?? 'g') === rule.unit ||
                  ((food.quantityUnit ?? 'g') === 'g' && !!rule.gramsPerUnit)
              );
              const food = matching.sort(
                (a, b) => Number(!!b.isCustom) - Number(!!a.isCustom)
              )[0];
              const quantity = food
                ? rule.free
                  ? {
                      amount: food.servingSizeGrams,
                      unit: food.quantityUnit ?? ('g' as QuantityUnit),
                    }
                  : {
                      amount:
                        (food.quantityUnit ?? 'g') === rule.unit
                          ? ruleAmount
                          : ruleAmount * rule.gramsPerUnit!,
                      unit: food.quantityUnit ?? ('g' as QuantityUnit),
                    }
                : rule.free
                ? null
                : { amount: ruleAmount, unit: rule.unit };
              const source = vegetableReference(rule);
              const detail =
                source && rule.notes === source.rule.notes
                  ? source.householdMeasure
                  : rule.notes;
              return makeIdea(
                `plan:${group}:${rule.id}`,
                food?.name ?? rule.name,
                food,
                quantity,
                rule,
                detail
              );
            })
            .sort(
              (a, b) =>
                Number(!a.nutrients) - Number(!b.nutrients) ||
                a.macroOverages.reduce(
                  (sum, item) =>
                    sum + item.extra / Math.max(1, goals[item.key]),
                  0
                ) -
                  b.macroOverages.reduce(
                    (sum, item) =>
                      sum + item.extra / Math.max(1, goals[item.key]),
                    0
                  ) ||
                a.portionOverages.length - b.portionOverages.length ||
                Number(b.source === 'personal') -
                  Number(a.source === 'personal') ||
                a.name.localeCompare(b.name, 'es')
            );
          return {
            group,
            consumed: value,
            target,
            remaining,
            freeRecords,
            ideas,
          };
        })
      : [];
  return {
    goals,
    consumed,
    remaining,
    exceeded,
    macroIdeas,
    groups,
    plan,
    pending: summary?.pending ?? 0,
  };
}
