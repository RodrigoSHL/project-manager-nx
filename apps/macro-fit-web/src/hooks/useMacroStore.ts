import { useState, useEffect } from 'react';
import { createAccountStorage } from '../features/auth/account-storage';
import {
  DailyLog,
  FoodGroup,
  FoodItem,
  MacroGoals,
  MealEntry,
  MealTemplate,
  MealType,
  UserProfile,
} from '../types/nutrition';
import { COMMON_FOODS } from '../data/common-foods';
import { DEFAULT_MEAL_TEMPLATES } from '../data/meal-templates';
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

export function useMacroStore(userId: string) {
  const [storage] = useState(() => createAccountStorage(userId));
  // 1. Perfil y metas (Por defecto: Pauta Clínica MEDS)
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = storage.getItem('macrofit_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [goals, setGoals] = useState<MacroGoals>(() => {
    try {
      const saved = storage.getItem('macrofit_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garantizar que si no tiene pautaPortions, cargue las de MEDS
        return {
          ...parsed,
          pautaPortions: parsed.pautaPortions || MEDS_PAUTA_PORTIONS,
        };
      }
      return MEDS_PAUTA_GOALS;
    } catch {
      return MEDS_PAUTA_GOALS;
    }
  });

  // 2. Alimentos personalizados
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = storage.getItem('macrofit_custom_foods');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Fecha activa y registro diario
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayDateString()
  );

  const [dailyLog, setDailyLog] = useState<DailyLog>(() => {
    try {
      const key = `macrofit_log_${getTodayDateString()}`;
      const saved = storage.getItem(key);
      if (saved) return JSON.parse(saved);

      return { date: getTodayDateString(), meals: [], waterIntakeMl: 0 };
    } catch {
      return { date: getTodayDateString(), meals: [], waterIntakeMl: 0 };
    }
  });

  // Cargar registro cuando cambia selectedDate
  useEffect(() => {
    try {
      const key = `macrofit_log_${selectedDate}`;
      const saved = storage.getItem(key);
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
  }, [selectedDate, storage]);

  const persistDailyLog = (updated: DailyLog) => {
    setDailyLog(updated);
    try {
      storage.setItem(`macrofit_log_${updated.date}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Error persistiendo diario:', e);
    }
  };

  const saveProfileAndGoals = (
    newProfile: UserProfile,
    newGoals: MacroGoals
  ) => {
    setProfile(newProfile);
    setGoals(newGoals);
    try {
      storage.setItem('macrofit_profile', JSON.stringify(newProfile));
      storage.setItem('macrofit_goals', JSON.stringify(newGoals));
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
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Calcular porciones equivalentes de la pauta si las tiene
    let portionGroup: FoodGroup | undefined;
    let portionsCount: number | undefined;

    if (food.portionEquiv) {
      portionGroup = food.portionEquiv.group;
      portionsCount = Number((food.portionEquiv.portions * ratio).toFixed(1));
    }

    const newEntry: MealEntry = {
      id:
        'meal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
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

    setDailyLog((prev) => {
      const updated: DailyLog = {
        ...prev,
        meals: [...prev.meals, newEntry],
      };
      try {
        storage.setItem(
          `macrofit_log_${updated.date}`,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error('Error persistiendo diario:', e);
      }
      return updated;
    });
  };

  const addMultipleMealEntries = (
    items: Array<{ mealType: MealType; food: FoodItem; amountGrams: number }>
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newEntries: MealEntry[] = items.map(
      ({ mealType, food, amountGrams }, idx) => {
        const ratio = amountGrams / food.servingSizeGrams;
        let portionGroup: FoodGroup | undefined;
        let portionsCount: number | undefined;

        if (food.portionEquiv) {
          portionGroup = food.portionEquiv.group;
          portionsCount = Number(
            (food.portionEquiv.portions * ratio).toFixed(1)
          );
        }

        return {
          id: `meal-${Date.now()}-${idx}-${Math.random()
            .toString(36)
            .substring(2, 6)}`,
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
      }
    );

    setDailyLog((prev) => {
      const updated: DailyLog = {
        ...prev,
        meals: [...prev.meals, ...newEntries],
      };
      try {
        storage.setItem(
          `macrofit_log_${updated.date}`,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error('Error persistiendo diario:', e);
      }
      return updated;
    });
  };

  const removeMealEntry = (entryId: string) => {
    setDailyLog((prev) => {
      const updated: DailyLog = {
        ...prev,
        meals: prev.meals.filter((m) => m.id !== entryId),
      };
      try {
        storage.setItem(
          `macrofit_log_${updated.date}`,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error('Error persistiendo diario:', e);
      }
      return updated;
    });
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
      storage.setItem('macrofit_custom_foods', JSON.stringify(nextList));
    } catch (e) {
      console.error('Error guardando alimento:', e);
    }
    return newFood;
  };

  // 4. Plantillas de Comidas / Combos precargados
  const [customTemplates, setCustomTemplates] = useState<MealTemplate[]>(() => {
    try {
      const saved = storage.getItem('macrofit_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allFoods: FoodItem[] = [...customFoods, ...COMMON_FOODS];
  const allTemplates: MealTemplate[] = [
    ...customTemplates,
    ...DEFAULT_MEAL_TEMPLATES,
  ];

  // Aplicar un combo/plantilla completa en un tiempo de comida
  const applyMealTemplate = (
    template: MealTemplate,
    targetMealType?: MealType
  ) => {
    const mealType = targetMealType || template.mealType;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newEntries: MealEntry[] = [];

    for (const item of template.items) {
      const food = allFoods.find((f) => f.id === item.foodId);
      if (!food) continue;

      const ratio = item.amountGrams / food.servingSizeGrams;
      let portionGroup: FoodGroup | undefined;
      let portionsCount: number | undefined;

      if (food.portionEquiv) {
        portionGroup = food.portionEquiv.group;
        portionsCount = Number((food.portionEquiv.portions * ratio).toFixed(1));
      }

      newEntries.push({
        id:
          'meal-' +
          Date.now() +
          '-' +
          Math.random().toString(36).substring(2, 6),
        mealType,
        foodId: food.id,
        foodName: food.name,
        amountGrams: item.amountGrams,
        calories: Math.round(food.calories * ratio),
        protein: Number((food.protein * ratio).toFixed(1)),
        carbs: Number((food.carbs * ratio).toFixed(1)),
        fat: Number((food.fat * ratio).toFixed(1)),
        portionGroup,
        portionsCount,
        timestamp: timeStr,
      });
    }

    const updated: DailyLog = {
      ...dailyLog,
      meals: [...dailyLog.meals, ...newEntries],
    };
    persistDailyLog(updated);
  };

  // Guardar la comida actual como plantilla reusable
  const saveMealAsTemplate = (
    name: string,
    description: string,
    mealType: MealType,
    entries: MealEntry[]
  ) => {
    const newTemplate: MealTemplate = {
      id: 'template-' + Date.now(),
      name,
      description,
      mealType,
      icon:
        mealType === 'breakfast' ? '🥣' : mealType === 'lunch' ? '🍱' : '🌙',
      items: entries.map((e) => ({
        foodId: e.foodId,
        amountGrams: e.amountGrams,
      })),
      isCustom: true,
    };

    const nextTemplates = [newTemplate, ...customTemplates];
    setCustomTemplates(nextTemplates);
    try {
      storage.setItem(
        'macrofit_custom_templates',
        JSON.stringify(nextTemplates)
      );
    } catch (e) {
      console.error('Error guardando plantilla:', e);
    }
  };

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
        else if (item.portionGroup === 'fruits')
          acc.fruits += item.portionsCount;
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
    allTemplates,
    selectedDate,
    setSelectedDate,
    dailyLog,
    consumedTotals,
    consumedPortions,
    saveProfileAndGoals,
    addMealEntry,
    addMultipleMealEntries,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
    applyMealTemplate,
    saveMealAsTemplate,
  };
}
