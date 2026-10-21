import { useState, useEffect } from 'react';
import {
  DailyLog,
  FoodGroup,
  FoodItem,
  MacroGoals,
  MealEntry,
  MealType,
  UserProfile,
} from '../types/nutrition';
import { COMMON_FOODS } from '../data/common-foods';
import { MEDS_PAUTA_GOALS, MEDS_PAUTA_PORTIONS } from '../utils/calculator';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Paciente MEDS',
  age: 28,
  gender: 'male',
  weightKg: 75,
  heightCm: 175,
  activityLevel: 'moderate',
  goal: 'meds_pauta',
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ejemplo inicial precargado exactamente según la TABLA 2 de la pauta MEDS
 */
const INITIAL_MEDS_MEALS: MealEntry[] = [
  // Comida 1: Desayuno (1 Carb, 2 Prot, ½ Grasa, 1 Lácteo)
  {
    id: 'seed-des-1',
    mealType: 'breakfast',
    foodId: 'meds-avena',
    foodName: 'Avena en Hojuelas (½ taza)',
    amountGrams: 40,
    calories: 145,
    protein: 5.5,
    carbs: 27,
    fat: 2.8,
    portionGroup: 'carbs',
    portionsCount: 1,
    timestamp: '08:00',
  },
  {
    id: 'seed-des-2',
    mealType: 'breakfast',
    foodId: 'meds-scoop-proteina',
    foodName: 'Proteína Whey en Polvo (1 scoop)',
    amountGrams: 30,
    calories: 120,
    protein: 24,
    carbs: 2,
    fat: 1.5,
    portionGroup: 'protein',
    portionsCount: 2,
    timestamp: '08:05',
  },
  {
    id: 'seed-des-3',
    mealType: 'breakfast',
    foodId: 'meds-palta-hass',
    foodName: 'Palta Hass (1.5 cucharadas)',
    amountGrams: 45,
    calories: 78,
    protein: 0.9,
    carbs: 2,
    fat: 7.5,
    portionGroup: 'fats',
    portionsCount: 0.5,
    timestamp: '08:05',
  },
  {
    id: 'seed-des-4',
    mealType: 'breakfast',
    foodId: 'meds-yogurt-descremado',
    foodName: 'Yogurt Descremado 0% (1 unidad)',
    amountGrams: 125,
    calories: 75,
    protein: 6.5,
    carbs: 10,
    fat: 0.2,
    portionGroup: 'dairy',
    portionsCount: 1,
    timestamp: '08:10',
  },

  // Colación AM: 1 Fruta + 1 Lácteo
  {
    id: 'seed-colam-1',
    mealType: 'colacion_am',
    foodId: 'meds-manzana',
    foodName: 'Manzana con piel (1 unidad entera)',
    amountGrams: 100,
    calories: 55,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    portionGroup: 'fruits',
    portionsCount: 1,
    timestamp: '11:00',
  },
  {
    id: 'seed-colam-2',
    mealType: 'colacion_am',
    foodId: 'meds-leche-descremada',
    foodName: 'Leche Descremada (1 taza)',
    amountGrams: 200,
    calories: 82,
    protein: 7,
    carbs: 10,
    fat: 1,
    portionGroup: 'dairy',
    portionsCount: 1,
    timestamp: '11:05',
  },

  // Comida 2: Almuerzo (Verduras libre + ½ Grasa + 4 Prot + 1 Carb + ½ Grasa + 1 Fruta)
  {
    id: 'seed-alm-1',
    mealType: 'lunch',
    foodId: 'meds-ensalada-verde',
    foodName: 'Vegetales variados (Ensalada verde libre)',
    amountGrams: 100,
    calories: 18,
    protein: 1.5,
    carbs: 2.5,
    fat: 0.2,
    portionGroup: 'veggies',
    portionsCount: 1,
    timestamp: '13:30',
  },
  {
    id: 'seed-alm-2',
    mealType: 'lunch',
    foodId: 'meds-pechuga-pollo',
    foodName: 'Pechuga de Pollo a la plancha (200g cocido)',
    amountGrams: 200,
    calories: 260,
    protein: 44,
    carbs: 2,
    fat: 7.2,
    portionGroup: 'protein',
    portionsCount: 4,
    timestamp: '13:35',
  },
  {
    id: 'seed-alm-3',
    mealType: 'lunch',
    foodId: 'meds-arroz-cocido',
    foodName: 'Arroz Blanco Cocido (¾ taza)',
    amountGrams: 110,
    calories: 143,
    protein: 3,
    carbs: 31,
    fat: 0.3,
    portionGroup: 'carbs',
    portionsCount: 1,
    timestamp: '13:35',
  },
  {
    id: 'seed-alm-4',
    mealType: 'lunch',
    foodId: 'meds-aceite-oliva',
    foodName: 'Aceite de Oliva Extra Virgen (4 cditas para ensalada)',
    amountGrams: 20,
    calories: 178,
    protein: 0,
    carbs: 0,
    fat: 20,
    portionGroup: 'fats',
    portionsCount: 1,
    timestamp: '13:35',
  },
  {
    id: 'seed-alm-5',
    mealType: 'lunch',
    foodId: 'meds-naranja',
    foodName: 'Naranja entera a elección (1 unidad)',
    amountGrams: 100,
    calories: 50,
    protein: 0.9,
    carbs: 12,
    fat: 0.2,
    portionGroup: 'fruits',
    portionsCount: 1,
    timestamp: '14:00',
  },

  // Colación PM: 1 Fruta + 1 Carbohidrato + 1 Lácteo
  {
    id: 'seed-colpm-1',
    mealType: 'colacion_pm',
    foodId: 'meds-platano',
    foodName: 'Plátano (½ unidad)',
    amountGrams: 60,
    calories: 58,
    protein: 0.7,
    carbs: 15,
    fat: 0.2,
    portionGroup: 'fruits',
    portionsCount: 1,
    timestamp: '17:30',
  },
  {
    id: 'seed-colpm-2',
    mealType: 'colacion_pm',
    foodId: 'meds-avena',
    foodName: 'Avena en Hojuelas (½ taza)',
    amountGrams: 40,
    calories: 145,
    protein: 5.5,
    carbs: 27,
    fat: 2.8,
    portionGroup: 'carbs',
    portionsCount: 1,
    timestamp: '17:30',
  },
  {
    id: 'seed-colpm-3',
    mealType: 'colacion_pm',
    foodId: 'meds-yogurt-proteico',
    foodName: 'Yogurt Proteico (1 unidad)',
    amountGrams: 150,
    calories: 85,
    protein: 12,
    carbs: 7,
    fat: 0.5,
    portionGroup: 'dairy',
    portionsCount: 1,
    timestamp: '17:35',
  },

  // Comida 3: Cena (Verduras libre + ½ Grasa + 4 Prot + 1 Carb)
  {
    id: 'seed-cena-1',
    mealType: 'dinner',
    foodId: 'meds-ensalada-verde',
    foodName: 'Vegetales variados (Ensalada libre)',
    amountGrams: 100,
    calories: 18,
    protein: 1.5,
    carbs: 2.5,
    fat: 0.2,
    portionGroup: 'veggies',
    portionsCount: 1,
    timestamp: '20:30',
  },
  {
    id: 'seed-cena-2',
    mealType: 'dinner',
    foodId: 'meds-carne-vacuno-magra',
    foodName: 'Vacuno Magro (Posta/Lomo cocido 200g)',
    amountGrams: 200,
    calories: 260,
    protein: 44,
    carbs: 0,
    fat: 8,
    portionGroup: 'protein',
    portionsCount: 4,
    timestamp: '20:35',
  },
  {
    id: 'seed-cena-3',
    mealType: 'dinner',
    foodId: 'meds-fideos-cocidos',
    foodName: 'Fideos Cocidos (¾ taza)',
    amountGrams: 110,
    calories: 142,
    protein: 4.8,
    carbs: 28.5,
    fat: 0.8,
    portionGroup: 'carbs',
    portionsCount: 1,
    timestamp: '20:35',
  },
  {
    id: 'seed-cena-4',
    mealType: 'dinner',
    foodId: 'meds-aceite-oliva',
    foodName: 'Aceite de Oliva Extra Virgen (2 cditas para aliñar)',
    amountGrams: 10,
    calories: 89,
    protein: 0,
    carbs: 0,
    fat: 10,
    portionGroup: 'fats',
    portionsCount: 0.5,
    timestamp: '20:35',
  },
];

export function useMacroStore() {
  // 1. Perfil y metas (Por defecto: Pauta Clínica MEDS)
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('macrofit_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [goals, setGoals] = useState<MacroGoals>(() => {
    try {
      const saved = localStorage.getItem('macrofit_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garantizar que si no tiene pautaPortions, cargue las de MEDS
        return { ...parsed, pautaPortions: parsed.pautaPortions || MEDS_PAUTA_PORTIONS };
      }
      return MEDS_PAUTA_GOALS;
    } catch {
      return MEDS_PAUTA_GOALS;
    }
  });

  // 2. Alimentos personalizados
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('macrofit_custom_foods');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Fecha activa y registro diario
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  const [dailyLog, setDailyLog] = useState<DailyLog>(() => {
    try {
      const key = `macrofit_log_${getTodayDateString()}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      // Pre-cargar la pauta MEDS como ejemplo activo del día
      const initialSeed: DailyLog = {
        date: getTodayDateString(),
        meals: INITIAL_MEDS_MEALS,
        waterIntakeMl: 2100,
      };
      localStorage.setItem(key, JSON.stringify(initialSeed));
      return initialSeed;
    } catch {
      return {
        date: getTodayDateString(),
        meals: INITIAL_MEDS_MEALS,
        waterIntakeMl: 2100,
      };
    }
  });

  // Cargar registro cuando cambia selectedDate
  useEffect(() => {
    try {
      const key = `macrofit_log_${selectedDate}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setDailyLog(JSON.parse(saved));
      } else {
        setDailyLog({
          date: selectedDate,
          meals: [],
          waterIntakeMl: 0,
        });
      }
    } catch (e) {
      console.error('Error cargando diario:', e);
    }
  }, [selectedDate]);

  const persistDailyLog = (updated: DailyLog) => {
    setDailyLog(updated);
    try {
      localStorage.setItem(`macrofit_log_${updated.date}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Error persistiendo diario:', e);
    }
  };

  const saveProfileAndGoals = (newProfile: UserProfile, newGoals: MacroGoals) => {
    setProfile(newProfile);
    setGoals(newGoals);
    try {
      localStorage.setItem('macrofit_profile', JSON.stringify(newProfile));
      localStorage.setItem('macrofit_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error('Error guardando perfil/metas:', e);
    }
  };

  const addMealEntry = (
    mealType: MealType,
    food: FoodItem,
    amountGrams: number
  ) => {
    const ratio = amountGrams / food.servingSizeGrams;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Calcular porciones equivalentes de la pauta si las tiene
    let portionGroup: FoodGroup | undefined;
    let portionsCount: number | undefined;

    if (food.portionEquiv) {
      portionGroup = food.portionEquiv.group;
      portionsCount = Number((food.portionEquiv.portions * ratio).toFixed(1));
    }

    const newEntry: MealEntry = {
      id: 'meal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      mealType,
      foodId: food.id,
      foodName: food.name,
      amountGrams,
      calories: Math.round(food.calories * ratio),
      protein: Number((food.protein * ratio).toFixed(1)),
      carbs: Number((food.carbs * ratio).toFixed(1)),
      fat: Number((food.fat * ratio).toFixed(1)),
      portionGroup,
      portionsCount,
      timestamp: timeStr,
    };

    const updated: DailyLog = {
      ...dailyLog,
      meals: [...dailyLog.meals, newEntry],
    };
    persistDailyLog(updated);
  };

  const removeMealEntry = (entryId: string) => {
    const updated: DailyLog = {
      ...dailyLog,
      meals: dailyLog.meals.filter((m) => m.id !== entryId),
    };
    persistDailyLog(updated);
  };

  const addWater = (amountMl: number) => {
    const nextVal = Math.max(0, (dailyLog.waterIntakeMl || 0) + amountMl);
    const updated: DailyLog = {
      ...dailyLog,
      waterIntakeMl: nextVal,
    };
    persistDailyLog(updated);
  };

  const resetWater = () => {
    const updated: DailyLog = {
      ...dailyLog,
      waterIntakeMl: 0,
    };
    persistDailyLog(updated);
  };

  const addCustomFood = (food: Omit<FoodItem, 'id' | 'isCustom'>) => {
    const newFood: FoodItem = {
      ...food,
      id: 'custom-' + Date.now(),
      isCustom: true,
    };
    const nextList = [...customFoods, newFood];
    setCustomFoods(nextList);
    try {
      localStorage.setItem('macrofit_custom_foods', JSON.stringify(nextList));
    } catch (e) {
      console.error('Error guardando alimento:', e);
    }
    return newFood;
  };

  const allFoods: FoodItem[] = [...customFoods, ...COMMON_FOODS];

  // Totales consumidos en macros
  const consumedTotals = dailyLog.meals.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Totales de porciones consumidas por grupo de la pauta
  const consumedPortions = dailyLog.meals.reduce(
    (acc, item) => {
      if (item.portionGroup && item.portionsCount) {
        if (item.portionGroup === 'protein') acc.protein += item.portionsCount;
        else if (item.portionGroup === 'carbs') acc.carbs += item.portionsCount;
        else if (item.portionGroup === 'fats') acc.fats += item.portionsCount;
        else if (item.portionGroup === 'dairy') acc.dairy += item.portionsCount;
        else if (item.portionGroup === 'fruits') acc.fruits += item.portionsCount;
      }
      return acc;
    },
    { protein: 0, carbs: 0, fats: 0, dairy: 0, fruits: 0 }
  );

  return {
    profile,
    goals,
    allFoods,
    customFoods,
    selectedDate,
    setSelectedDate,
    dailyLog,
    consumedTotals,
    consumedPortions,
    saveProfileAndGoals,
    addMealEntry,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
  };
}
