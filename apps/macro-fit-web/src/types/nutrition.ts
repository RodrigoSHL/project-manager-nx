export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'      // Poco o ningún ejercicio
  | 'light'          // Ejercicio ligero (1-3 días/sem)
  | 'moderate'       // Ejercicio moderado (3-5 días/sem)
  | 'active'         // Ejercicio intenso (6-7 días/sem)
  | 'very_active';   // Muy intenso o trabajo físico

export type Goal =
  | 'meds_pauta'      // Pauta Clínica MEDS (10 Prot, 4 Carb, 2 Grasa, 3 Lácteos, 3 Frutas)
  | 'aggressive_loss' // Déficit agresivo (-25%)
  | 'moderate_loss'   // Pérdida de grasa (-20%)
  | 'mild_loss'       // Definición suave (-10%)
  | 'maintenance'     // Mantenimiento (0%)
  | 'lean_bulk'       // Volumen limpio (+10%)
  | 'aggressive_bulk';// Volumen potente (+15%)

export type MacroDistributionPreset =
  | 'meds_pauta'   // Pauta Nutricionista Clínica MEDS (143g P, 205g C, 66g G ~1990 kcal)
  | 'balanced'     // 30% Prot, 40% Carb, 30% Fat
  | 'high_protein' // 40% Prot, 35% Carb, 25% Fat
  | 'low_carb'     // 35% Prot, 20% Carb, 45% Fat
  | 'keto'         // 25% Prot, 5% Carb, 70% Fat
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
  carbs: number;   // 4
  fats: number;    // 2
  dairy: number;   // 3
  fruits: number;  // 3
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

export type FoodGroup = 'protein' | 'carbs' | 'fats' | 'dairy' | 'fruits' | 'veggies' | 'supplements' | 'custom';

export interface PortionEquivalence {
  group: FoodGroup;
  portions: number;       // ej: 1 porción de proteína
  secondaryGroup?: FoodGroup;
  secondaryPortions?: number; // ej: legumbres = 1 proteína + 0.5 carb
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingUnit: string;      // ej: "50g (1 trozo 6x6 cm)", "1 scoop (30g)"
  servingSizeGrams: number; // base para cálculos
  calories: number;        // kcal por porción base
  protein: number;         // gramos
  carbs: number;           // gramos
  fat: number;             // gramos
  fiber?: number;          // gramos opcional
  category: 'protein' | 'carbs' | 'fats' | 'fruits_veggies' | 'dairy' | 'snacks' | 'custom';
  portionEquiv?: PortionEquivalence;
  medsRecommended?: boolean;
  notes?: string;
  isCustom?: boolean;
}

export type MealType = 'breakfast' | 'colacion_am' | 'lunch' | 'colacion_pm' | 'dinner' | 'snacks';

export interface MealEntry {
  id: string;
  mealType: MealType;
  foodId: string;
  foodName: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionGroup?: FoodGroup;
  portionsCount?: number;
  timestamp: string;
}

export interface DailyLog {
  date: string; // formato YYYY-MM-DD
  meals: MealEntry[];
  waterIntakeMl: number;
  notes?: string;
  weightCheckKg?: number;
}

export interface MealTemplateItem {
  foodId: string;
  amountGrams: number;
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

