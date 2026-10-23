import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const number = (max: number) => z.number().finite().min(0).max(max);
const positive = (max: number) => number(max).positive();
export const identifierSchema = text(100).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Fecha inválida');
export const mealTypeSchema = z.enum([
  'breakfast',
  'colacion_am',
  'lunch',
  'colacion_pm',
  'dinner',
  'snacks',
]);
const group = z.enum([
  'protein',
  'carbs',
  'fats',
  'dairy',
  'fruits',
  'veggies',
  'supplements',
  'custom',
]);
export const profileSchema = z
  .object({
    name: text(150),
    age: z.number().int().min(14).max(120),
    gender: z.enum(['male', 'female']),
    weightKg: positive(500),
    heightCm: positive(300),
    activityLevel: z.enum([
      'sedentary',
      'light',
      'moderate',
      'active',
      'very_active',
    ]),
    goal: z.enum([
      'meds_pauta',
      'aggressive_loss',
      'moderate_loss',
      'mild_loss',
      'maintenance',
      'lean_bulk',
      'aggressive_bulk',
    ]),
    customBmr: positive(20000).optional(),
    customTdee: positive(30000).optional(),
  })
  .strict();
export const goalsSchema = z
  .object({
    calories: positive(30000),
    proteinGrams: number(3000),
    carbsGrams: number(5000),
    fatGrams: number(3000),
    waterTargetMl: positive(20000),
    distributionPreset: z.enum([
      'meds_pauta',
      'balanced',
      'high_protein',
      'low_carb',
      'keto',
      'custom',
    ]),
    pautaPortions: z
      .object({
        protein: number(100),
        carbs: number(100),
        fats: number(100),
        dairy: number(100),
        fruits: number(100),
        veggies: text(100),
        waterLitres: positive(20),
      })
      .strict()
      .optional(),
  })
  .strict();
export const settingsSchema = z
  .object({ profile: profileSchema, goals: goalsSchema })
  .strict();
export const foodSchema = z
  .object({
    id: identifierSchema,
    name: text(200),
    brand: text(150).optional(),
    servingUnit: text(150),
    servingSizeGrams: positive(20000),
    calories: number(100000),
    protein: number(20000),
    carbs: number(20000),
    fat: number(20000),
    fiber: number(20000).optional(),
    category: z.enum([
      'protein',
      'carbs',
      'fats',
      'fruits_veggies',
      'dairy',
      'snacks',
      'custom',
    ]),
    portionEquiv: z
      .object({
        group,
        portions: number(1000),
        secondaryGroup: group.optional(),
        secondaryPortions: number(1000).optional(),
      })
      .strict()
      .optional(),
    medsRecommended: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
    isCustom: z.boolean().optional(),
  })
  .strict();
export const mealEntrySchema = z
  .object({
    id: identifierSchema,
    mealType: mealTypeSchema,
    foodId: identifierSchema,
    foodName: text(200),
    amountGrams: positive(20000),
    calories: number(100000),
    protein: number(20000),
    carbs: number(20000),
    fat: number(20000),
    portionGroup: group.optional(),
    portionsCount: number(1000).optional(),
    timestamp: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  })
  .strict();
export const addMealsSchema = z
  .object({ entries: z.array(mealEntrySchema).min(1).max(100) })
  .strict();
export const waterSchema = z
  .object({
    operationId: z.string().uuid(),
    amountMl: z.number().int().min(-20000).max(20000),
    reset: z.boolean().optional(),
  })
  .strict();
export const templateSchema = z
  .object({
    id: identifierSchema,
    name: text(150),
    description: z.string().max(1000),
    mealType: mealTypeSchema,
    icon: text(30),
    items: z
      .array(
        z
          .object({
            foodId: identifierSchema,
            amountGrams: positive(20000),
            food: foodSchema.optional(),
          })
          .strict()
      )
      .min(1)
      .max(100),
    isCustom: z.boolean().optional(),
  })
  .strict();
export const dailyLogSchema = z
  .object({
    date: dateSchema,
    meals: z.array(mealEntrySchema).max(1000),
    waterIntakeMl: z.number().int().min(0).max(30000),
    notes: z.string().max(5000).optional(),
    weightCheckKg: positive(500).optional(),
  })
  .strict();
export const importSchema = z
  .object({
    settings: settingsSchema.optional(),
    foods: z.array(foodSchema).max(1000),
    templates: z.array(templateSchema).max(1000),
    logs: z.array(dailyLogSchema).max(3660),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export type ImportData = z.infer<typeof importSchema>;
export type WaterChange = z.infer<typeof waterSchema>;
export const nutritionAccountSchema = z
  .object({
    profile: profileSchema.nullable(),
    goals: goalsSchema.nullable(),
    customFoods: z.array(foodSchema),
    customTemplates: z.array(templateSchema),
    legacyImported: z.boolean(),
  })
  .strict()
  .refine((account) => (account.profile === null) === (account.goals === null));
export type NutritionAccount = z.infer<typeof nutritionAccountSchema>;
