export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary' // Poco o ningún ejercicio
  | 'light' // Ejercicio ligero (1-3 días/sem)
  | 'moderate' // Ejercicio moderado (3-5 días/sem)
  | 'active' // Ejercicio intenso (6-7 días/sem)
  | 'very_active'; // Muy intenso o trabajo físico

export type Goal =
  | 'meds_pauta' // Pauta Clínica MEDS (10 Prot, 4 Carb, 2 Grasa, 3 Lácteos, 3 Frutas)
  | 'aggressive_loss' // Déficit agresivo (-25%)
  | 'moderate_loss' // Pérdida de grasa (-20%)
  | 'mild_loss' // Definición suave (-10%)
  | 'maintenance' // Mantenimiento (0%)
  | 'lean_bulk' // Volumen limpio (+10%)
  | 'aggressive_bulk'; // Volumen potente (+15%)

export type MacroDistributionPreset =
  | 'meds_pauta' // Pauta Nutricionista Clínica MEDS (143g P, 205g C, 66g G ~1990 kcal)
  | 'balanced' // 30% Prot, 40% Carb, 30% Fat
  | 'high_protein' // 40% Prot, 35% Carb, 25% Fat
  | 'low_carb' // 35% Prot, 20% Carb, 45% Fat
  | 'keto' // 25% Prot, 5% Carb, 70% Fat
  | 'custom';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  customBmr?: number;
  customTdee?: number;
}

export interface PautaPortionsTarget {
  protein: number; // 10
  carbs: number; // 4
  fats: number; // 2
  dairy: number; // 3
  fruits: number; // 3
  veggies: string; // 'Libre'
  waterLitres: number; // >2
}

export interface MacroGoals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterTargetMl: number;
  distributionPreset: MacroDistributionPreset;
  pautaPortions?: PautaPortionsTarget;
}

export type FoodGroup =
  | 'protein'
  | 'carbs'
  | 'fats'
  | 'dairy'
  | 'fruits'
  | 'veggies'
  | 'supplements'
  | 'custom';

export interface PortionEquivalence {
  group: FoodGroup;
  portions: number; // ej: 1 porción de proteína
  secondaryGroup?: FoodGroup;
  secondaryPortions?: number; // ej: legumbres = 1 proteína + 0.5 carb
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  productSource?: import('./products').ProductSource;
  servingUnit: string; // ej: "50g (1 trozo 6x6 cm)", "1 scoop (30g)"
  servingSizeGrams: number; // Legacy base quantity; quantityUnit defaults to grams.
  /** When present, the legacy base above is expressed in this unit, not grams. */
  quantityUnit?: QuantityUnit;
  calories: number; // kcal por porción base
  protein: number; // gramos
  carbs: number; // gramos
  fat: number; // gramos
  fiber?: number; // gramos opcional
  category:
    | 'protein'
    | 'carbs'
    | 'fats'
    | 'fruits_veggies'
    | 'dairy'
    | 'snacks'
    | 'custom';
  portionEquiv?: PortionEquivalence;
  medsRecommended?: boolean;
  notes?: string;
  isCustom?: boolean;
  /** Explicit selection for this registration/template, independent of nutrient grams. */
  pautaSelection?: PautaSelection;
}

export type MealType =
  | 'breakfast'
  | 'colacion_am'
  | 'lunch'
  | 'colacion_pm'
  | 'dinner'
  | 'snacks';

export interface MealEntry {
  id: string;
  mealType: MealType;
  foodId: string;
  foodName: string;
  amountGrams: number;
  /** Authoritative quantity/unit. amountGrams remains a legacy numeric field. */
  quantity?: { amount: number; unit: QuantityUnit };
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionGroup?: FoodGroup;
  portionsCount?: number;
  timestamp: string;
  pautaSelection?: PautaSelection;
  pauta?: PautaEntrySnapshot;
}

export interface DailyLog {
  date: string; // formato YYYY-MM-DD
  meals: MealEntry[];
  waterIntakeMl: number;
  notes?: string;
  weightCheckKg?: number;
  nutritionPlan?: NutritionPlan | null;
}

export const PAUTA_GROUPS = [
  'protein',
  'carbs',
  'fats',
  'dairy',
  'fruits',
  'veggies',
  'supplements',
] as const;
export type PautaGroup = (typeof PAUTA_GROUPS)[number];
export type QuantityUnit = 'g' | 'ml' | 'unit' | 'scoop' | 'cup';
export interface PortionContribution {
  group: PautaGroup;
  portions: number;
}
export interface PautaRule {
  id: string;
  name: string;
  foodIds: string[];
  /** Exact aliases only: a raw/cooked or branded food must never be guessed. */
  aliases: string[];
  referenceAmount: number;
  unit: QuantityUnit;
  gramsPerUnit?: number;
  contributions: PortionContribution[];
  free: boolean;
  notes: string;
}
export interface NutritionPlanInput {
  name: string;
  startsOn: string;
  enabled: boolean;
  targets: Record<PautaGroup, number | null>;
  waterTargetMl: number;
  waterIsMinimum: boolean;
  rules: PautaRule[];
}
export interface NutritionPlan extends NutritionPlanInput {
  version: number;
  createdAt: string;
}
export interface SaveNutritionPlanInput extends NutritionPlanInput {
  applyToToday?: boolean;
}
export interface PautaSelection {
  /** null explicitly leaves the food pending instead of automatic matching. */
  ruleId: string | null;
  quantity?: { amount: number; unit: QuantityUnit };
}
export interface PautaEntrySnapshot {
  planVersion: number;
  ruleId?: string;
  ruleName?: string;
  status: 'matched' | 'pending' | 'free';
  contributions: PortionContribution[];
}

export interface MealTemplateItem {
  food?: FoodItem; // Snapshot for meals analyzed by AI or a changed catalog.
  foodId: string;
  amountGrams: number;
  quantityUnit?: QuantityUnit;
}

export interface MealTemplate {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  icon: string;
  items: MealTemplateItem[];
  isCustom?: boolean;
}

export type FoodCategory =
  | 'proteina'
  | 'carbohidrato'
  | 'grasa'
  | 'verdura'
  | 'fruta'
  | 'lacteo'
  | 'legumbre';

export interface NutrientsPer100g {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface AnalyzedPlateItem {
  id: string;
  name: string;
  category: FoodCategory;
  estimated_grams: number;
  adjusted_grams: number;
  confidence: 'alta' | 'media' | 'baja';
  nutritional_density_per_100g: NutrientsPer100g;
  selected: boolean;
  quantity_source?: 'declared' | 'estimated';
}

export interface PlateAnalysisResponse {
  dish_name: string;
  plate_type_detected: 'plato_extendido' | 'plato_hondo' | 'bowl';
  total_estimated_kcal: number;
  items: Array<{
    name: string;
    category: FoodCategory;
    estimated_grams: number;
    confidence: 'alta' | 'media' | 'baja';
    nutritional_density_per_100g: NutrientsPer100g;
    quantity_source?: 'declared' | 'estimated';
  }>;
  clinical_tip: string;
  meal_type?: MealType | 'unspecified';
  assumptions?: string[];
}
