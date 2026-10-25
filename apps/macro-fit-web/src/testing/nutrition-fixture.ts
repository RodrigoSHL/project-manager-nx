import { vi } from 'vitest';
import { DailyLog, NutritionAccount, calculatePauta } from '../types/nutrition';

export const testAccount: NutritionAccount = {
  profile: {
    name: 'Persona de prueba',
    age: 32,
    gender: 'female',
    weightKg: 65,
    heightCm: 167,
    activityLevel: 'moderate',
    goal: 'maintenance',
  },
  goals: {
    calories: 2100,
    proteinGrams: 140,
    carbsGrams: 220,
    fatGrams: 75,
    waterTargetMl: 2500,
    distributionPreset: 'balanced',
  },
  customFoods: [],
  customTemplates: [],
  legacyImported: false,
};
export function testToken(sub = 'test-user') {
  return `test.${btoa(
    JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })
  )}.signature`;
}
export function nutritionFixture(initial: NutritionAccount = testAccount) {
  let account = structuredClone(initial);
  const days = new Map<string, DailyLog>();
  const response = (body: unknown) => ({
    ok: true,
    status: 200,
    json: async () => structuredClone(body),
  });
  const fetch = vi.fn(async (url: string, init: RequestInit = {}) => {
    const body = init.body ? JSON.parse(init.body as string) : null;
    const path = url.replace('/api/macrofit/me', '');
    if (path === '') return response(account);
    if (path === '/settings') {
      account = { ...account, ...body };
      return response(account);
    }
    if (path === '/plan') {
      const { applyToToday, ...definition } = body;
      account.nutritionPlan = {
        ...definition,
        version: (account.nutritionPlan?.version ?? 0) + 1,
        createdAt: new Date().toISOString(),
      };
      const savedPlan = account.nutritionPlan;
      if (applyToToday && savedPlan) {
        const log: DailyLog = days.get(definition.startsOn) ?? {
          date: definition.startsOn,
          meals: [],
          waterIntakeMl: 0,
        };
        log.nutritionPlan = structuredClone(savedPlan);
        log.meals = log.meals.map((entry) => ({
          ...entry,
          pauta: calculatePauta(savedPlan, entry, entry.pautaSelection),
        }));
        days.set(log.date, log);
      }
      return response(account);
    }
    if (path === '/templates') {
      account.customTemplates.push(body);
      return response(account);
    }
    if (path === '/foods') {
      account.customFoods = [
        ...account.customFoods.filter((food) => food.id !== body.id),
        body,
      ];
      return response(account);
    }
    if (
      path.startsWith('/foods/') &&
      path.endsWith('/equivalence') &&
      init.method === 'PUT'
    ) {
      const id = decodeURIComponent(path.split('/')[2]);
      const product = account.customFoods.find((food) => food.id === id);
      if (
        !product ||
        !account.nutritionPlan ||
        account.nutritionPlan.version !== body.expectedPlanVersion
      )
        throw new Error('Invalid product equivalence fixture request');
      const rule = {
        id: 'saved-product-' + id,
        name: product.name,
        foodIds: [id],
        aliases: [],
        ...body.equivalence,
      };
      account.nutritionPlan = {
        ...account.nutritionPlan,
        version: account.nutritionPlan.version + 1,
        rules: [...account.nutritionPlan.rules, rule],
      };
      return response(account);
    }
    if (path.startsWith('/foods/') && init.method === 'DELETE') {
      account.customFoods = account.customFoods.filter(
        (food) => food.id !== decodeURIComponent(path.slice('/foods/'.length))
      );
      return response(account);
    }
    const match = /^\/days\/(\d{4}-\d{2}-\d{2})(.*)$/.exec(path);
    if (!match) throw new Error(`Unexpected fixture path: ${url}`);
    const [, date, suffix] = match;
    const log = days.get(date) ?? { date, meals: [], waterIntakeMl: 0 };
    if (
      !log.nutritionPlan &&
      account.nutritionPlan?.enabled &&
      account.nutritionPlan.startsOn <= date
    )
      log.nutritionPlan = structuredClone(account.nutritionPlan);
    if (suffix === '/meals')
      log.meals.push(
        ...body.entries.map((entry: DailyLog['meals'][number]) => ({
          ...entry,
          ...(log.nutritionPlan
            ? {
                pauta: calculatePauta(
                  log.nutritionPlan,
                  entry,
                  entry.pautaSelection
                ),
              }
            : {}),
        }))
      );
    const quantityEdit = /^\/meals\/([^/]+)\/quantity$/.exec(suffix);
    if (quantityEdit && init.method === 'PUT') {
      const item = log.meals.find((entry) => entry.id === quantityEdit[1]);
      if (!item)
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: 'Alimento no encontrado.' }),
        };
      const previousAmount = item.quantity?.amount ?? item.amountGrams;
      const ratio = body.quantity.amount / previousAmount;
      item.amountGrams = body.quantity.amount;
      item.quantity = body.quantity;
      item.calories = Math.round(item.calories * ratio);
      for (const nutrient of ['protein', 'carbs', 'fat'] as const)
        item[nutrient] = Number((item[nutrient] * ratio).toFixed(1));
      if (item.pautaSelection?.quantity)
        item.pautaSelection.quantity.amount *= ratio;
      if (item.portionsCount != null) item.portionsCount *= ratio;
      if (log.nutritionPlan)
        item.pauta = calculatePauta(
          log.nutritionPlan,
          item,
          item.pautaSelection
        );
    }
    const productClassification =
      /^\/meals\/([^/]+)\/(product-equivalence|equivalence)$/.exec(suffix);
    if (productClassification && log.nutritionPlan && account.nutritionPlan) {
      const product = account.customFoods.find(
        (food) => food.id === body.productId
      );
      const entry = log.meals.find(
        (item) => item.id === productClassification[1]
      );
      if (
        !entry ||
        (productClassification[2] === 'product-equivalence' && !product)
      )
        throw new Error('Missing product or meal in fixture');
      const rule = {
        id:
          productClassification[2] === 'product-equivalence'
            ? 'product-' + product!.id
            : 'meal-' + entry.id,
        name:
          productClassification[2] === 'product-equivalence'
            ? product!.name
            : entry.foodName,
        foodIds: [
          productClassification[2] === 'product-equivalence'
            ? product!.id
            : entry.foodId,
        ],
        aliases: [],
        ...body.equivalence,
      };
      account.nutritionPlan = {
        ...account.nutritionPlan,
        version: account.nutritionPlan.version + 1,
        rules: [
          ...account.nutritionPlan.rules.filter((item) => item.id !== rule.id),
          rule,
        ],
      };
      log.nutritionPlan.rules = [
        ...log.nutritionPlan.rules.filter((item) => item.id !== rule.id),
        rule,
      ];
      entry.pautaSelection = {
        ruleId: rule.id,
        ...(body.quantity ? { quantity: body.quantity } : {}),
      };
      entry.pauta = calculatePauta(
        log.nutritionPlan,
        entry,
        entry.pautaSelection
      );
      days.set(date, log);
      return response({ account, day: log });
    }
    const classification = /^\/meals\/([^/]+)\/pauta$/.exec(suffix);
    if (classification && log.nutritionPlan) {
      const entry = log.meals.find((item) => item.id === classification[1]);
      if (entry) {
        entry.pautaSelection = body;
        entry.pauta = calculatePauta(log.nutritionPlan, entry, body);
      }
    }
    if (suffix === '/water')
      log.waterIntakeMl = body.reset ? 0 : log.waterIntakeMl + body.amountMl;
    days.set(date, log);
    return response(log);
  });
  return { fetch, days, account: () => account };
}
export function withRecords(
  other: (path: string, init?: RequestInit) => unknown
) {
  const records = nutritionFixture();
  return (path: string, init?: RequestInit) =>
    path.startsWith('/api/macrofit/me')
      ? records.fetch(path, init)
      : other(path, init);
}
