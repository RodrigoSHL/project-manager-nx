import {
  MealEntry,
  NutritionPlan,
  PautaEntrySnapshot,
  PautaRule,
  PautaSelection,
  PAUTA_GROUPS,
  PautaGroup,
} from './nutrition';

export function isNutritionPlanConfigured(plan: {
  rules?: readonly unknown[];
  targets?: Partial<Record<PautaGroup, number | null>>;
}) {
  return (
    (plan.rules?.length ?? 0) > 0 &&
    Object.values(plan.targets ?? {}).some((target) => target != null)
  );
}

export const PAUTA_LABELS: Record<PautaGroup, string> = {
  protein: 'Proteínas',
  carbs: 'Carbohidratos',
  fats: 'Grasas',
  dairy: 'Lácteos',
  fruits: 'Frutas',
  veggies: 'Verduras',
  supplements: 'Suplementos',
};
export const QUANTITY_LABELS = {
  g: 'g',
  ml: 'ml',
  unit: 'unidades',
  scoop: 'scoops',
  cup: 'tazas',
};
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export function findPautaRule(
  plan: NutritionPlan,
  foodId: string,
  foodName: string
): PautaRule | undefined {
  const byId = plan.rules.filter((rule) => rule.foodIds.includes(foodId));
  if (byId.length) return byId.length === 1 ? byId[0] : undefined;
  const byName = plan.rules.filter((rule) =>
    [rule.name, ...rule.aliases].some(
      (name) => normalize(name) === normalize(foodName)
    )
  );
  return byName.length === 1 ? byName[0] : undefined;
}

/** Shared preview and server calculation. Nutrient grams are never used to infer exchange groups. */
export function calculatePauta(
  plan: NutritionPlan,
  food: Pick<MealEntry, 'foodId' | 'foodName' | 'amountGrams' | 'quantity'>,
  selection?: PautaSelection
): PautaEntrySnapshot {
  const pending: PautaEntrySnapshot = {
    planVersion: plan.version,
    status: 'pending',
    contributions: [],
  };
  const rule = selection
    ? plan.rules.find((item) => item.id === selection.ruleId)
    : findPautaRule(plan, food.foodId, food.foodName);
  if (!rule) return pending;
  if (rule.free)
    return {
      planVersion: plan.version,
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'free',
      contributions: [],
    };
  const quantity = selection?.quantity ??
    food.quantity ?? { amount: food.amountGrams, unit: 'g' as const };
  const amount =
    quantity.unit === rule.unit
      ? quantity.amount
      : quantity.unit === 'g' && rule.gramsPerUnit
      ? quantity.amount / rule.gramsPerUnit
      : undefined;
  if (amount === undefined || !Number.isFinite(amount) || amount <= 0)
    return pending;
  const ratio = amount / rule.referenceAmount;
  const contributions = rule.contributions.map((item) => ({
    ...item,
    portions: item.portions * ratio,
  }));
  if (
    contributions.some(
      (item) => !Number.isFinite(item.portions) || item.portions > 1000
    )
  )
    return pending;
  return {
    planVersion: plan.version,
    ruleId: rule.id,
    ruleName: rule.name,
    status: 'matched',
    contributions,
  };
}

export function summarizePauta(meals: MealEntry[], plan: NutritionPlan) {
  const consumed = Object.fromEntries(
    PAUTA_GROUPS.map((group) => [group, 0])
  ) as Record<PautaGroup, number>;
  let pending = 0;
  for (const meal of meals) {
    // Legacy rows remain pending until explicitly reviewed; never backfill guesses on a read.
    if (
      !meal.pauta ||
      meal.pauta.planVersion !== plan.version ||
      meal.pauta.status === 'pending'
    ) {
      pending++;
      continue;
    }
    for (const contribution of meal.pauta.contributions)
      consumed[contribution.group] += contribution.portions;
  }
  return { consumed, pending };
}

export const formatPortions = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
