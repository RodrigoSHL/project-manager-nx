import { useState, useEffect, useRef } from 'react';
import {
  DailyLog,
  FoodItem,
  MacroGoals,
  MealEntry,
  MealTemplate,
  MealType,
  NutritionAccount,
  SaveNutritionPlanInput,
  PautaSelection,
  summarizePauta,
  UserProfile,
} from '../types/nutrition';
import { COMMON_FOODS } from '../data/common-foods';
import { DEFAULT_MEAL_TEMPLATES } from '../data/meal-templates';
import { resolveTemplateFood } from '../utils/mealTemplates';
import { nutritionRequest } from '../utils/nutritionApi';
import {
  getAccessToken,
  SessionChangedError,
} from '../features/auth/auth-session';
import { readLegacyData } from '../features/auth/account-storage';

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;
}

function entry(
  mealType: MealType,
  food: FoodItem,
  amountGrams: number
): MealEntry {
  const ratio = amountGrams / food.servingSizeGrams;
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    mealType,
    foodId: food.id,
    foodName: food.name,
    amountGrams,
    quantity: { amount: amountGrams, unit: food.quantityUnit ?? 'g' },
    calories: Math.round(food.calories * ratio),
    protein: Number((food.protein * ratio).toFixed(1)),
    carbs: Number((food.carbs * ratio).toFixed(1)),
    fat: Number((food.fat * ratio).toFixed(1)),
    ...(food.pautaSelection ? { pautaSelection: food.pautaSelection } : {}),
    timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`,
  };
}

export function useMacroStore(userId: string) {
  const [account, setAccount] = useState<NutritionAccount | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const activeDate = useRef(selectedDate);
  activeDate.current = selectedDate;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setLoading(true);
    setError(null);
    void Promise.all([
      nutritionRequest<NutritionAccount>(
        '',
        'GET',
        undefined,
        controller.signal
      ),
      nutritionRequest<DailyLog>(
        `/days/${selectedDate}`,
        'GET',
        undefined,
        controller.signal
      ),
    ])
      .then(([nextAccount, log]) => {
        if (disposed) return;
        setAccount(nextAccount);
        setDailyLog(log);
        setNeedsReload(false);
      })
      .catch((failure: unknown) => {
        if (!disposed)
          setError(
            failure instanceof Error
              ? failure.message
              : 'No se pudieron cargar tus registros.'
          );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
        clearTimeout(timeout);
      });
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [userId, selectedDate, revision]);

  async function mutate<T>(
    path: string,
    method: string,
    body: unknown,
    apply: (value: T) => void
  ): Promise<boolean> {
    if (busy.current || needsReload || loading) return false;
    busy.current = true;
    setSaving(true);
    setError(null);
    const token = getAccessToken();
    try {
      const result = await nutritionRequest<T>(path, method, body);
      if (!mounted.current || token !== getAccessToken()) return false;
      apply(result);
      return true;
    } catch (failure) {
      if (mounted.current && !(failure instanceof SessionChangedError)) {
        setError(
          `${
            failure instanceof Error
              ? failure.message
              : 'No se pudo confirmar el guardado.'
          } Actualiza los registros antes de intentarlo otra vez.`
        );
        setNeedsReload(true);
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  const saveProfileAndGoals = (profile: UserProfile, goals: MacroGoals) =>
    mutate<NutritionAccount>(
      '/settings',
      'PUT',
      { profile, goals },
      setAccount
    );
  const saveNutritionPlan = (input: SaveNutritionPlanInput) =>
    mutate<NutritionAccount>('/plan', 'PUT', input, (value) => {
      setAccount(value);
      setRevision((revision) => revision + 1);
    });
  const changeDay = (suffix: string, method: string, body?: unknown) => {
    const date = selectedDate;
    return mutate<DailyLog>(`/days/${date}${suffix}`, method, body, (log) => {
      if (activeDate.current === date) setDailyLog(log);
    });
  };
  const addMultipleMealEntries = (
    items: Array<{ mealType: MealType; food: FoodItem; amountGrams: number }>
  ) =>
    changeDay('/meals', 'POST', {
      entries: items.map((item) =>
        entry(item.mealType, item.food, item.amountGrams)
      ),
    });
  const addMealEntry = (
    mealType: MealType,
    food: FoodItem,
    amountGrams: number
  ) => addMultipleMealEntries([{ mealType, food, amountGrams }]);
  const classifyMeal = (id: string, selection: PautaSelection) =>
    changeDay(`/meals/${encodeURIComponent(id)}/pauta`, 'PUT', selection);
  const removeMealEntry = (id: string) =>
    changeDay(`/meals/${encodeURIComponent(id)}`, 'DELETE');
  const addWater = (amountMl: number) =>
    changeDay('/water', 'POST', { operationId: crypto.randomUUID(), amountMl });
  const resetWater = () =>
    changeDay('/water', 'POST', {
      operationId: crypto.randomUUID(),
      amountMl: 0,
      reset: true,
    });
  const addCustomFood = (food: Omit<FoodItem, 'id' | 'isCustom'>) =>
    mutate<NutritionAccount>(
      '/foods',
      'PUT',
      { ...food, id: crypto.randomUUID(), isCustom: true },
      setAccount
    );
  const allFoods = [...(account?.customFoods ?? []), ...COMMON_FOODS];
  const allTemplates = [
    ...(account?.customTemplates ?? []),
    ...DEFAULT_MEAL_TEMPLATES,
  ];
  const applyMealTemplate = async (
    template: MealTemplate,
    target?: MealType
  ) => {
    const items = template.items.map((item) => ({
      ...item,
      food: resolveTemplateFood(item, allFoods),
    }));
    if (items.some((item) => !item.food)) {
      setError(
        'Este combo necesita revisión: falta un alimento o sus unidades cambiaron. Vuelve a guardarlo desde el diario.'
      );
      return false;
    }
    return addMultipleMealEntries(
      items.map((item) => ({
        mealType: target ?? template.mealType,
        food: item.food!,
        amountGrams: item.amountGrams,
      }))
    );
  };
  const saveMealAsTemplate = (
    name: string,
    description: string,
    mealType: MealType,
    entries: MealEntry[]
  ) => {
    const template: MealTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      mealType,
      icon:
        mealType === 'breakfast' ? '🥣' : mealType === 'lunch' ? '🍱' : '🌙',
      isCustom: true,
      items: entries.map((item) => ({
        foodId: item.foodId,
        quantityUnit: item.quantity?.unit,
        amountGrams: item.amountGrams,
        food: {
          id: item.foodId,
          name: item.foodName,
          servingUnit: `${item.amountGrams}g`,
          servingSizeGrams: item.amountGrams,
          quantityUnit: item.quantity?.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          category: 'custom',
          ...(item.pautaSelection
            ? { pautaSelection: item.pautaSelection }
            : {}),
          ...(item.portionGroup && item.portionsCount != null
            ? {
                portionEquiv: {
                  group: item.portionGroup,
                  portions: item.portionsCount,
                },
              }
            : {}),
        },
      })),
    };
    return mutate<NutritionAccount>('/templates', 'PUT', template, setAccount);
  };
  const importLegacy = async () => {
    try {
      const legacy = readLegacyData(userId);
      const saved = await mutate<NutritionAccount>(
        '/import',
        'POST',
        legacy.data,
        setAccount
      );
      if (saved) {
        setRevision((value) => value + 1);
      }
      return saved;
    } catch {
      setError(
        'No se pudieron validar los datos locales. Los originales se conservan.'
      );
      return false;
    }
  };
  const consumedTotals = (dailyLog?.meals ?? []).reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const dayPlan = dailyLog?.nutritionPlan ?? null;
  const portionSummary = dayPlan
    ? summarizePauta(dailyLog?.meals ?? [], dayPlan)
    : null;
  return {
    profile: account?.profile ?? null,
    goals: account?.goals ?? null,
    legacyImported: account?.legacyImported ?? false,
    allFoods,
    allTemplates,
    customFoods: account?.customFoods ?? [],
    selectedDate,
    setSelectedDate,
    dailyLog: dailyLog?.date === selectedDate ? dailyLog : null,
    consumedTotals,
    nutritionPlan: account?.nutritionPlan ?? null,
    dayPlan,
    portionSummary,
    saveNutritionPlan,
    classifyMeal,
    loading,
    saving,
    error,
    needsReload,
    reload: () => setRevision((value) => value + 1),
    saveProfileAndGoals,
    addMealEntry,
    addMultipleMealEntries,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
    applyMealTemplate,
    saveMealAsTemplate,
    importLegacy,
  };
}
