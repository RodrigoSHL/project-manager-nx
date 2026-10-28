import { z } from 'zod';
import { dateSchema, goalsSchema } from './schemas';
import { PAUTA_GROUPS, DailyLog } from './nutrition';
import { summarizePauta } from './pauta';

export const dashboardRangeSchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
  })
  .strict()
  .refine(({ from, to }) => {
    const days = (Date.parse(to) - Date.parse(from)) / 86400000;
    return days >= 0 && days < 90;
  }, 'Selecciona un período de hasta 90 días.');

export function dashboardDates(from: string, to: string) {
  const dates: string[] = [];
  for (let time = Date.parse(from); time <= Date.parse(to); time += 86400000)
    dates.push(new Date(time).toISOString().slice(0, 10));
  return dates;
}

const amount = z.number().finite().nonnegative();
const portions = z.object(
  Object.fromEntries(PAUTA_GROUPS.map((group) => [group, amount])) as Record<
    (typeof PAUTA_GROUPS)[number],
    typeof amount
  >
);
const targets = z.object(
  Object.fromEntries(
    PAUTA_GROUPS.map((group) => [group, amount.nullable()])
  ) as Record<(typeof PAUTA_GROUPS)[number], z.ZodNullable<typeof amount>>
);
export const dashboardDaySchema = z.object({
  date: dateSchema,
  mealCount: z.number().int().nonnegative(),
  totals: z.object({
    calories: amount,
    protein: amount,
    carbs: amount,
    fat: amount,
  }),
  waterIntakeMl: amount,
  plan: z
    .object({
      name: z.string(),
      version: z.number().int().positive(),
      targets,
      consumed: portions,
      pending: z.number().int().nonnegative(),
      waterTargetMl: amount,
      waterIsMinimum: z.boolean(),
    })
    .nullable(),
});
export const dashboardResponseSchema = z.object({
  from: dateSchema,
  to: dateSchema,
  goals: goalsSchema.nullable(),
  days: z.array(dashboardDaySchema).max(90),
});
export type DashboardDay = z.infer<typeof dashboardDaySchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/** Uses saved portion snapshots; never infers portions from nutrient grams. */
export function summarizeDashboardDay(log: DailyLog): DashboardDay {
  const plan = log.nutritionPlan?.enabled ? log.nutritionPlan : null;
  const summary = plan ? summarizePauta(log.meals, plan) : null;
  return {
    date: log.date,
    mealCount: log.meals.length,
    totals: log.meals.reduce(
      (sum, meal) => ({
        calories: sum.calories + meal.calories,
        protein: sum.protein + meal.protein,
        carbs: sum.carbs + meal.carbs,
        fat: sum.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ),
    waterIntakeMl: log.waterIntakeMl,
    plan:
      plan && summary
        ? {
            name: plan.name,
            version: plan.version,
            targets: plan.targets,
            consumed: summary.consumed,
            pending: summary.pending,
            waterTargetMl: plan.waterTargetMl,
            waterIsMinimum: plan.waterIsMinimum,
          }
        : null,
  };
}
