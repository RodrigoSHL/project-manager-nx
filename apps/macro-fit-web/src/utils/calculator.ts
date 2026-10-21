import {
  ActivityLevel,
  Gender,
  Goal,
  MacroDistributionPreset,
  MacroGoals,
  UserProfile,
} from '../types/nutrition';

/**
 * Multiplicadores de actividad física sobre la Tasa Metabólica Basal (BMR)
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentary: { label: 'Sedentario', desc: 'Trabajo de escritorio, poco o nada de ejercicio' },
  light: { label: 'Ligero', desc: 'Ejercicio suave 1 a 3 días por semana' },
  moderate: { label: 'Moderado', desc: 'Entrenamiento moderado 3 a 5 días por semana' },
  active: { label: 'Activo', desc: 'Entrenamiento intenso 6 a 7 días por semana' },
  very_active: { label: 'Muy activo', desc: 'Atleta o entrenamiento doble sesión / trabajo físico' },
};

/**
 * Factores de ajuste calórico según el objetivo
 */
export const GOAL_ADJUSTMENTS: Record<Goal, { multiplier: number; label: string; desc: string }> = {
  aggressive_loss: {
    multiplier: 0.75,
    label: 'Déficit Agresivo (-25%)',
    desc: 'Pérdida rápida de grasa a corto plazo',
  },
  moderate_loss: {
    multiplier: 0.80,
    label: 'Pérdida de Grasa (-20%)',
    desc: 'Recomendado para definir preservando músculo',
  },
  mild_loss: {
    multiplier: 0.90,
    label: 'Definición Suave (-10%)',
    desc: 'Déficit leve, ideal para recomposición',
  },
  maintenance: {
    multiplier: 1.0,
    label: 'Mantenimiento (0%)',
    desc: 'Mantener peso corporal actual y energía estable',
  },
  lean_bulk: {
    multiplier: 1.10,
    label: 'Volumen Limpio (+10%)',
    desc: 'Ganancia de masa muscular minimizando grasa',
  },
  aggressive_bulk: {
    multiplier: 1.15,
    label: 'Volumen Potente (+15%)',
    desc: 'Foco en ganancia máxima de fuerza y peso',
  },
};

/**
 * Distribución estándar de macronutrientes (% de calorías)
 * 1g Proteína = 4 kcal
 * 1g Carbohidrato = 4 kcal
 * 1g Grasa = 9 kcal
 */
export const PRESET_RATIOS: Record<
  Exclude<MacroDistributionPreset, 'custom'>,
  { proteinPct: number; carbsPct: number; fatPct: number; name: string; desc: string }
> = {
  balanced: {
    proteinPct: 30,
    carbsPct: 40,
    fatPct: 30,
    name: 'Equilibrado (30/40/30)',
    desc: 'Distribución balanceada ideal para la mayoría de personas activas.',
  },
  high_protein: {
    proteinPct: 40,
    carbsPct: 35,
    fatPct: 25,
    name: 'Alto en Proteína (40/35/25)',
    desc: 'Ideal para hipertrofia, saciedad y protección muscular en definición.',
  },
  low_carb: {
    proteinPct: 35,
    carbsPct: 20,
    fatPct: 45,
    name: 'Bajo en Carbos (35/20/45)',
    desc: 'Control glucémico, mayor proporción de grasas saludables.',
  },
  keto: {
    proteinPct: 25,
    carbsPct: 5,
    fatPct: 70,
    name: 'Cetogénico / Keto (25/5/70)',
    desc: 'Enfoque estricto bajo en carbohidratos para inducir cetosis.',
  },
};

/**
 * Calcula la Tasa Metabólica Basal (BMR) usando la ecuación Mifflin-St Jeor (estándar clínico)
 */
export function calculateBmr(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  
  // Mifflin-St Jeor:
  // Hombres: 10 * peso + 6.25 * altura - 5 * edad + 5
  // Mujeres: 10 * peso + 6.25 * altura - 5 * edad - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Calcula el Gasto Energético Total Diario (TDEE)
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calcula calorías meta ajustadas por objetivo
 */
export function calculateTargetCalories(tdee: number, goal: Goal): number {
  const adjustment = GOAL_ADJUSTMENTS[goal] || { multiplier: 1.0 };
  return Math.round(tdee * adjustment.multiplier);
}

/**
 * Calcula los gramos de macronutrientes basados en calorías totales y preset
 */
export function calculateMacrosFromPreset(
  targetCalories: number,
  preset: Exclude<MacroDistributionPreset, 'custom'>,
  weightKg?: number
): { proteinGrams: number; carbsGrams: number; fatGrams: number } {
  const ratio = PRESET_RATIOS[preset];

  const proteinCals = targetCalories * (ratio.proteinPct / 100);
  const carbsCals = targetCalories * (ratio.carbsPct / 100);
  const fatCals = targetCalories * (ratio.fatPct / 100);

  return {
    proteinGrams: Math.round(proteinCals / 4),
    carbsGrams: Math.round(carbsCals / 4),
    fatGrams: Math.round(fatCals / 9),
  };
}

/**
 * Recomienda ingesta de agua según peso y actividad
 */
export function calculateRecommendedWater(weightKg: number, activityLevel: ActivityLevel): number {
  // Base: ~35 ml por kg de peso corporal
  let baseMl = weightKg * 35;
  if (activityLevel === 'moderate') baseMl += 350;
  if (activityLevel === 'active') baseMl += 650;
  if (activityLevel === 'very_active') baseMl += 1000;
  return Math.round(Math.max(1800, baseMl));
}

/**
 * Genera el paquete completo de metas nutricionales a partir del perfil
 */
export function generateNutritionPlan(
  profile: UserProfile,
  preset: MacroDistributionPreset = 'high_protein'
): { bmr: number; tdee: number; goals: MacroGoals } {
  const bmr = calculateBmr(profile.gender, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTdee(bmr, profile.activityLevel);
  const targetCalories = calculateTargetCalories(tdee, profile.goal);

  const safePreset: Exclude<MacroDistributionPreset, 'custom'> =
    preset === 'custom' ? 'high_protein' : preset;

  const macros = calculateMacrosFromPreset(targetCalories, safePreset, profile.weightKg);
  const waterTargetMl = calculateRecommendedWater(profile.weightKg, profile.activityLevel);

  return {
    bmr,
    tdee,
    goals: {
      calories: targetCalories,
      proteinGrams: macros.proteinGrams,
      carbsGrams: macros.carbsGrams,
      fatGrams: macros.fatGrams,
      waterTargetMl,
      distributionPreset: preset,
    },
  };
}
