import { useState, useEffect } from 'react';
import {
  DailyLog,
  FoodItem,
  MacroGoals,
  MealEntry,
  MealType,
  UserProfile,
} from '../types/nutrition';
import { COMMON_FOODS } from '../data/common-foods';
import { generateNutritionPlan } from '../utils/calculator';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Atleta',
  age: 28,
  gender: 'male',
  weightKg: 75,
  heightCm: 175,
  activityLevel: 'moderate',
  goal: 'moderate_loss',
};

const DEFAULT_PLAN = generateNutritionPlan(DEFAULT_PROFILE, 'high_protein');

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useMacroStore() {
  // 1. Perfil y metas
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
      return saved ? JSON.parse(saved) : DEFAULT_PLAN.goals;
    } catch {
      return DEFAULT_PLAN.goals;
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

      // Si es el primer uso de hoy, precargar un ejemplo representativo para que se vea activo
      const initialSeed: DailyLog = {
        date: getTodayDateString(),
        meals: [
          {
            id: 'seed-1',
            mealType: 'breakfast',
            foodId: 'food-oats',
            foodName: 'Avena en Hojuelas (Cruda)',
            amountGrams: 80,
            calories: 311,
            protein: 13.5,
            carbs: 53,
            fat: 5.5,
            timestamp: '08:30',
          },
          {
            id: 'seed-2',
            mealType: 'breakfast',
            foodId: 'food-egg-whole',
            foodName: 'Huevo Entero (Grande)',
            amountGrams: 110,
            calories: 156,
            protein: 12.6,
            carbs: 1.2,
            fat: 10.6,
            timestamp: '08:35',
          },
          {
            id: 'seed-3',
            mealType: 'lunch',
            foodId: 'food-chicken-breast',
            foodName: 'Pechuga de Pollo (Cocida)',
            amountGrams: 180,
            calories: 297,
            protein: 55.8,
            carbs: 0,
            fat: 6.5,
            timestamp: '13:15',
          },
          {
            id: 'seed-4',
            mealType: 'lunch',
            foodId: 'food-white-rice',
            foodName: 'Arroz Blanco (Cocido)',
            amountGrams: 150,
            calories: 195,
            protein: 4.1,
            carbs: 42.3,
            fat: 0.5,
            timestamp: '13:15',
          },
        ],
        waterIntakeMl: 1250,
      };
      localStorage.setItem(key, JSON.stringify(initialSeed));
      return initialSeed;
    } catch {
      return {
        date: getTodayDateString(),
        meals: [],
        waterIntakeMl: 0,
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

  // Guardar log al actualizarse
  const persistDailyLog = (updated: DailyLog) => {
    setDailyLog(updated);
    try {
      localStorage.setItem(`macrofit_log_${updated.date}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Error persistiendo diario:', e);
    }
  };

  // Guardar perfil y metas
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

  // Agregar alimento al registro
  const addMealEntry = (
    mealType: MealType,
    food: FoodItem,
    amountGrams: number
  ) => {
    const ratio = amountGrams / food.servingSizeGrams;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
      timestamp: timeStr,
    };

    const updated: DailyLog = {
      ...dailyLog,
      meals: [...dailyLog.meals, newEntry],
    };
    persistDailyLog(updated);
  };

  // Eliminar alimento del registro
  const removeMealEntry = (entryId: string) => {
    const updated: DailyLog = {
      ...dailyLog,
      meals: dailyLog.meals.filter((m) => m.id !== entryId),
    };
    persistDailyLog(updated);
  };

  // Actualizar agua
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

  // Agregar alimento personalizado al catálogo
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

  // Catálogo unificado (estándar + personalizados)
  const allFoods: FoodItem[] = [...customFoods, ...COMMON_FOODS];

  // Totales consumidos en el día
  const consumedTotals = dailyLog.meals.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
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
    saveProfileAndGoals,
    addMealEntry,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
  };
}
