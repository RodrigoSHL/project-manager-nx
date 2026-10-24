import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  MealEntry,
  FoodItem,
  Settings,
  NutritionPlanInput,
  dailyLogSchema,
  equivalenceSuggestionsSchema,
  productEquivalenceResultSchema,
  ProductEquivalenceInput,
  createPautaTemplate,
} from '@project-manager/macrofit-contracts';
import {
  NutritionMealEntryEntity,
  NutritionPlanEntity,
  nutritionEntities,
} from './entities/nutrition.entity';
import { NutritionService } from './nutrition.service';
import { EquivalenceSuggestionsController } from './equivalence-suggestions.controller';
import { EquivalenceSuggestionsService } from './equivalence-suggestions.service';
import { PlateAnalysisService } from '../plate-analysis/plate-analysis.service';
import { NutritionController } from './nutrition.controller';
import { AddNutritionPlans1792742400000 } from '../../migrations/1792742400000-AddNutritionPlans';
import { AddDayProductEquivalences1792785600000 } from '../../migrations/1792785600000-AddDayProductEquivalences';
import { CreateNutritionRecords1792713600000 } from '../../migrations/1792713600000-CreateNutritionRecords';

const url = process.env.MACROFIT_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
// Only an explicitly provided disposable test database may be mutated by this suite.
if (url && !new URL(url).pathname.startsWith('/macrofit_test'))
  throw new Error('Use a disposable macrofit_test database.');

suite('Nutrition PostgreSQL integration', () => {
  const a = randomUUID();
  const b = randomUUID();
  const date = '2026-10-23';
  const settings: Settings = {
    profile: {
      name: 'Persona real',
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
  };
  const meal = (id = randomUUID()): MealEntry => ({
    id,
    mealType: 'lunch',
    foodId: 'own-food',
    foodName: 'Carne',
    amountGrams: 200,
    calories: 400,
    protein: 50,
    carbs: 0,
    fat: 22,
    timestamp: '13:45',
  });
  const food: FoodItem = {
    id: 'own-food',
    name: 'Carne',
    servingUnit: '100g',
    servingSizeGrams: 100,
    calories: 200,
    protein: 25,
    carbs: 0,
    fat: 11,
    category: 'protein',
  };
  const db = new DataSource({
    type: 'postgres',
    url,
    entities: nutritionEntities,
    migrations: [
      CreateNutritionRecords1792713600000,
      AddNutritionPlans1792742400000,
      AddDayProductEquivalences1792785600000,
    ],
    synchronize: false,
  });
  const rankEquivalences = jest.fn();
  let service: NutritionService;
  let app: INestApplication;
  let origin: string;
  beforeAll(async () => {
    await db.initialize();
    await db.runMigrations();
    const module = await Test.createTestingModule({
      controllers: [NutritionController, EquivalenceSuggestionsController],
      providers: [
        NutritionService,
        EquivalenceSuggestionsService,
        {
          provide: PlateAnalysisService,
          useValue: { rankEquivalences },
        },
        { provide: DataSource, useValue: db },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
    service = module.get(NutritionService);
  });
  afterAll(async () => {
    await app?.close();
    if (db.isInitialized) await db.destroy();
  });
  const call = (path = '', init: RequestInit = {}) =>
    fetch(`${origin}/api/me${path}`, {
      ...init,
      headers: {
        'x-user-id': a,
        'content-type': 'application/json',
        ...init.headers,
      },
    });
  it('starts without any profile or fabricated records and requires a valid internal identity', async () => {
    expect(await service.getAccount(a)).toEqual({
      profile: null,
      goals: null,
      customFoods: [],
      customTemplates: [],
      legacyImported: false,
      nutritionPlan: null,
    });
    expect((await service.getDay(a, date)).meals).toEqual([]);
    expect((await fetch(`${origin}/api/me`)).status).toBe(401);
    expect(
      (await call('', { headers: { 'x-user-id': 'forged' } })).status
    ).toBe(401);
    expect((await call()).headers.get('cache-control')).toBe('no-store');
  });
  it('validates nested bodies, rejects userId injection and impossible dates without writing anything', async () => {
    expect(
      (
        await call('/settings', {
          method: 'PUT',
          body: JSON.stringify({ ...settings, userId: b }),
        })
      ).status
    ).toBe(400);
    expect(
      (
        await call('/settings', {
          method: 'PUT',
          body: JSON.stringify({
            ...settings,
            profile: { ...settings.profile, weightKg: -1 },
          }),
        })
      ).status
    ).toBe(400);
    expect((await call('/days/2026-02-31')).status).toBe(400);
    expect(
      (
        await call(`/days/${date}/meals`, {
          method: 'POST',
          body: JSON.stringify({ entries: [{ ...meal(), amountGrams: -10 }] }),
        })
      ).status
    ).toBe(400);
    expect((await service.getAccount(a)).profile).toBeNull();
  });
  it('persists profile, foods, templates and batches with full ownership isolation', async () => {
    await service.saveSettings(a, settings);
    await service.saveFood(a, food);
    await service.saveTemplate(a, {
      id: 'combo',
      name: 'Mi almuerzo',
      description: '',
      mealType: 'lunch',
      icon: '🍱',
      items: [{ foodId: food.id, amountGrams: 200, food }],
    });
    const entries = [meal(), meal()];
    await service.addMeals(a, date, entries);
    await service.addMeals(a, date, entries); // Idempotent request retry.
    expect(
      (await service.getDay(a, date)).meals.map((entry) => entry.id)
    ).toEqual(entries.map((entry) => entry.id));
    expect(
      (await service.getAccount(a)).customTemplates[0].items[0].food?.name
    ).toBe('Carne');
    expect((await service.getAccount(b)).customFoods).toEqual([]);
    expect((await service.getDay(b, date)).meals).toEqual([]);
    await service.removeMeal(b, date, entries[0].id);
    expect((await service.getDay(a, date)).meals).toHaveLength(2);
    await expect(
      service.removeCatalogItem(b, 'foods', food.id)
    ).rejects.toThrow('Registro no encontrado');
    const before = (await service.getDay(a, date)).meals.length;
    await expect(
      service.addMeals(a, date, [meal(), { ...entries[0], amountGrams: 999 }])
    ).rejects.toThrow('identificador');
    expect((await service.getDay(a, date)).meals).toHaveLength(before); // Whole batch rolled back.
    await service.removeMeal(a, date, entries[0].id);
    expect((await service.getDay(a, date)).meals).toHaveLength(1);
  });
  it('adds concurrent water and meals without lost updates and deduplicates water retries', async () => {
    const operation = { operationId: randomUUID(), amountMl: 250 };
    await Promise.all([
      service.changeWater(a, date, operation),
      service.changeWater(a, date, operation),
    ]);
    expect((await service.getDay(a, date)).waterIntakeMl).toBe(250);
    await Promise.all(
      Array.from({ length: 8 }, () =>
        service.changeWater(a, date, {
          operationId: randomUUID(),
          amountMl: 250,
        })
      )
    );
    expect((await service.getDay(a, date)).waterIntakeMl).toBe(2250);
    await Promise.all(
      Array.from({ length: 8 }, () => service.addMeals(a, date, [meal()]))
    );
    expect((await service.getDay(a, date)).meals).toHaveLength(9);
    await service.changeWater(a, date, {
      operationId: randomUUID(),
      amountMl: 0,
      reset: true,
    });
    expect((await service.getDay(a, date)).waterIntakeMl).toBe(0);
  });
  it('persists imported product metadata, scopes barcodes per account and preserves historical snapshots on edit/delete', async () => {
    const owner = randomUUID();
    const other = randomUUID();
    const product: FoodItem = {
      ...food,
      id: 'personal-product',
      name: 'Yogur especial',
      barcode: '7801234567890',
      brand: 'Mi marca',
      calories: 72,
      productSource: {
        kind: 'open_food_facts',
        url: 'https://world.openfoodfacts.org/product/7801234567890',
      },
    };
    const response = await call('/foods', {
      method: 'PUT',
      headers: { 'x-user-id': owner },
      body: JSON.stringify(product),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).customFoods[0]).toMatchObject(product);
    await service.saveTemplate(owner, {
      id: 'product-combo',
      name: 'Mi combo',
      description: '',
      mealType: 'lunch',
      icon: '🥛',
      items: [{ foodId: product.id, amountGrams: 100, food: product }],
    });
    const registration = {
      ...meal(),
      foodId: product.id,
      foodName: product.name,
      calories: 72,
    };
    await service.addMeals(owner, date, [registration]);
    await service.saveFood(owner, {
      ...product,
      name: 'Nueva versión',
      calories: 81,
    });
    expect((await service.getAccount(owner)).customFoods[0].calories).toBe(81);
    await expect(
      service.saveFood(owner, { ...product, id: 'duplicate' })
    ).rejects.toMatchObject({ status: 409 });
    await service.saveFood(other, product);
    await expect(
      service.removeCatalogItem(other, 'foods', 'not-owned')
    ).rejects.toMatchObject({ status: 404 });
    await service.removeCatalogItem(owner, 'foods', product.id);
    expect((await service.getAccount(owner)).customFoods).toEqual([]);
    expect((await service.getDay(owner, date)).meals[0]).toMatchObject({
      foodName: 'Yogur especial',
      calories: 72,
    });
    expect(
      (await service.getAccount(owner)).customTemplates[0].items[0].food
        ?.calories
    ).toBe(72);
    expect((await service.getAccount(other)).customFoods[0].barcode).toBe(
      product.barcode
    );
  });
  it('imports once transactionally without overwriting server records', async () => {
    const legacy = {
      settings: { ...settings, profile: { ...settings.profile, name: 'Old' } },
      foods: [{ ...food, name: 'Old food' }],
      templates: [],
      logs: [
        { date, meals: [meal()], waterIntakeMl: 999 },
        { date: '2026-10-22', meals: [meal()], waterIntakeMl: 500 },
      ],
    };
    await service.importLegacy(a, legacy);
    await service.importLegacy(a, legacy);
    expect((await service.getAccount(a)).profile?.name).toBe('Persona real');
    expect((await service.getAccount(a)).customFoods[0].name).toBe('Carne');
    expect((await service.getDay(a, date)).meals).toHaveLength(9);
    expect((await service.getDay(a, '2026-10-22')).meals).toHaveLength(1);
    expect((await service.getDay(a, '2026-10-22')).waterIntakeMl).toBe(500);
    expect((await service.getAccount(b)).legacyImported).toBe(false);
  });
  it('calculates exchanges on the server, isolates plan ownership and freezes daily versions', async () => {
    const owner = randomUUID();
    const stranger = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const tomorrow = new Date(today + 'T12:00:00Z');
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const nextDate = tomorrow.toISOString().slice(0, 10);
    const input: NutritionPlanInput = {
      name: 'Mi pauta',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: 4,
        fats: 2,
        dairy: 3,
        fruits: 3,
        veggies: null,
        supplements: 0,
      },
      waterTargetMl: 2000,
      waterIsMinimum: true,
      rules: [
        {
          id: 'lentils',
          name: 'Lentejas cocidas',
          foodIds: ['own-food'],
          aliases: [],
          referenceAmount: 140,
          unit: 'g',
          free: false,
          notes: 'Cocidas',
          contributions: [
            { group: 'protein', portions: 1 },
            { group: 'carbs', portions: 0.5 },
          ],
        },
      ],
    };
    expect((await service.getAccount(owner)).nutritionPlan).toBeNull();
    await service.savePlan(owner, input);
    expect((await service.getAccount(stranger)).nutritionPlan).toBeNull();
    const original = {
      ...meal(),
      amountGrams: 140,
      pauta: {
        planVersion: 999,
        status: 'matched' as const,
        contributions: [{ group: 'protein' as const, portions: 999 }],
      },
    };
    const day = await service.addMeals(owner, today, [original]);
    expect(day.meals[0].pauta).toMatchObject({
      planVersion: 1,
      contributions: [
        { group: 'protein', portions: 1 },
        { group: 'carbs', portions: 0.5 },
      ],
    });
    await service.savePlan(owner, {
      ...input,
      targets: { ...input.targets, protein: 5 },
      rules: [{ ...input.rules[0], referenceAmount: 280 }],
    });
    await service.saveSettings(owner, settings);
    expect((await service.getAccount(owner)).nutritionPlan?.version).toBe(2);
    expect(
      (await service.getDay(owner, today)).nutritionPlan?.targets.protein
    ).toBe(10);
    await service.addMeals(owner, today, [original]);
    expect((await service.getDay(owner, today)).meals).toHaveLength(1);
    const next = await service.addMeals(owner, nextDate, [
      { ...meal(), amountGrams: 140 },
    ]);
    expect(next.nutritionPlan?.version).toBe(2);
    expect(next.meals[0].pauta?.contributions[0].portions).toBe(0.5);
    await expect(
      service.classifyMeal(stranger, today, original.id, { ruleId: 'lentils' })
    ).rejects.toThrow('Alimento no encontrado');
    await expect(
      service.classifyMeal(owner, today, original.id, { ruleId: 'foreign' })
    ).rejects.toThrow('no pertenece');
    await service.classifyMeal(owner, today, original.id, { ruleId: null });
    expect((await service.getDay(owner, today)).meals[0].pauta?.status).toBe(
      'pending'
    );
    await service.classifyMeal(owner, today, original.id, {
      ruleId: 'lentils',
    });
    expect(
      (await service.getDay(owner, today)).meals[0].pauta?.contributions[0]
        .portions
    ).toBe(1);
    expect(
      (await service.getDay(owner, '2020-01-01')).nutritionPlan
    ).toBeNull();
    await expect(
      service.savePlan(owner, { ...input, startsOn: '2020-01-01' })
    ).rejects.toThrow('historial');
  });
  it('repairs a frozen blank plan for today only after explicit application and preserves the previous day and all nutrients', async () => {
    const owner = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const old = new Date(today + 'T12:00:00Z');
    old.setUTCDate(old.getUTCDate() - 1);
    const yesterday = old.toISOString().slice(0, 10);
    const blank = {
      name: 'Old empty plan',
      startsOn: yesterday,
      enabled: true,
      version: 1,
      createdAt: new Date().toISOString(),
      targets: {
        protein: null,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [],
    };
    // Simulate an already persisted plan from the original release. Reads remain backward compatible.
    await db.manager.insert(NutritionPlanEntity, {
      userId: owner,
      version: 1,
      startsOn: yesterday,
      data: blank,
    });
    const original = meal();
    const unknown = {
      ...meal(),
      foodId: 'unknown',
      foodName: 'Mayonesa',
      amountGrams: 9,
    };
    await service.addMeals(owner, yesterday, [meal()]);
    await service.addMeals(owner, today, [original, unknown]);
    await service.changeWater(owner, today, {
      operationId: randomUUID(),
      amountMl: 250,
    });
    const beforeToday = await service.getDay(owner, today);
    const beforeYesterday = await service.getDay(owner, yesterday);
    const configured: NutritionPlanInput = {
      ...blank,
      startsOn: today,
      targets: { ...blank.targets, protein: 10 },
      rules: [
        {
          id: 'chicken',
          name: 'Pollo cocido',
          foodIds: ['own-food'],
          aliases: [],
          referenceAmount: 50,
          unit: 'g',
          free: false,
          notes: '',
          contributions: [{ group: 'protein', portions: 1 }],
        },
      ],
    };
    await service.savePlan(owner, { ...configured, applyToToday: true });
    const after = await service.getDay(owner, today);
    expect(after.nutritionPlan?.version).toBe(2);
    expect(after.nutritionPlan?.targets.protein).toBe(10);
    expect(after.waterIntakeMl).toBe(250);
    expect(after.meals[0].pauta?.contributions).toEqual([
      { group: 'protein', portions: 4 },
    ]);
    expect(after.meals[1].pauta?.status).toBe('pending');
    const nutrients = (log: typeof after) =>
      log.meals.map((entry) => {
        const saved = { ...entry };
        delete saved.pauta;
        return saved;
      });
    expect(nutrients(after)).toEqual(nutrients(beforeToday));
    expect(await service.getDay(owner, yesterday)).toEqual(beforeYesterday);
    expect(
      (
        await db.manager.findOneByOrFail(NutritionPlanEntity, {
          userId: owner,
          version: 1,
        })
      ).data
    ).toEqual(blank);
    expect((await service.getAccount(owner)).nutritionPlan).not.toHaveProperty(
      'applyToToday'
    );
    await expect(
      service.savePlan(owner, {
        ...configured,
        startsOn: '2099-01-01',
        applyToToday: true,
      })
    ).rejects.toThrow('comience hoy');
    await expect(
      service.savePlan(owner, { ...blank, startsOn: today })
    ).rejects.toThrow('metas y equivalencias');
  });
  it('rejects malformed plans and snapshot/ownership injection through the HTTP endpoints', async () => {
    const response = await call('/plan', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Invalid', userId: b }),
    });
    expect(response.status).toBe(400);
    expect(
      (
        await fetch(origin + '/api/me/plan', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        })
      ).status
    ).toBe(401);
  });
  it('edits historical quantities in place, recalculates the frozen plan and avoids cumulative nutrient rounding', async () => {
    const owner = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const input: NutritionPlanInput = {
      name: 'Pauta para edición',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'tuna',
          name: 'Atún',
          foodIds: ['own-food'],
          aliases: [],
          referenceAmount: 60,
          unit: 'g',
          free: false,
          notes: '',
          contributions: [{ group: 'protein', portions: 1 }],
        },
      ],
    };
    await service.savePlan(owner, input);
    const original: MealEntry = {
      ...meal(),
      foodName: 'Atún',
      amountGrams: 140,
      quantity: { amount: 140, unit: 'g' },
      calories: 163,
      protein: 31.7,
      carbs: 0.2,
      fat: 2.1,
    };
    const sibling = meal();
    await service.addMeals(owner, today, [original, sibling]);
    await service.changeWater(owner, today, {
      operationId: randomUUID(),
      amountMl: 250,
    });
    const before = await service.getDay(owner, today);
    const originalRow = await db.manager.findOneByOrFail(
      NutritionMealEntryEntity,
      { userId: owner, id: original.id }
    );
    // A later plan and a changed catalog must not replace this meal's historical basis.
    await service.savePlan(owner, {
      ...input,
      rules: [{ ...input.rules[0], referenceAmount: 120 }],
    });
    await service.saveFood(owner, { ...food, calories: 900, protein: 80 });
    const edit = (amount: number, expected: number) =>
      call(`/days/${today}/meals/${original.id}/quantity`, {
        method: 'PUT',
        headers: { 'x-user-id': owner },
        body: JSON.stringify({
          quantity: { amount, unit: 'g' },
          expectedQuantity: { amount: expected, unit: 'g' },
        }),
      });
    const response = await edit(120, 140);
    expect(response.status).toBe(200);
    const edited = await response.json();
    expect(dailyLogSchema.safeParse(edited).success).toBe(true);
    expect(edited.meals[0]).toMatchObject({
      id: original.id,
      foodName: 'Atún',
      amountGrams: 120,
      quantity: { amount: 120, unit: 'g' },
      calories: 140,
      protein: 27.2,
      carbs: 0.2,
      fat: 1.8,
      timestamp: original.timestamp,
      pauta: {
        planVersion: 1,
        contributions: [{ group: 'protein', portions: 2 }],
      },
    });
    expect(edited.meals[0]).not.toHaveProperty('quantityReference');
    expect(edited.meals[1]).toEqual(before.meals[1]);
    expect(edited.waterIntakeMl).toBe(250);
    expect((await edit(120, 140)).status).toBe(200); // Exact request retry is a no-op.
    expect((await edit(100, 140)).status).toBe(409); // A stale correction cannot overwrite the current quantity.
    expect((await service.getDay(owner, today)).meals[0].amountGrams).toBe(120);
    expect((await edit(1, 120)).status).toBe(200);
    expect((await edit(140, 1)).status).toBe(200);
    const restored = await service.getDay(owner, today);
    expect(restored.meals).toEqual(before.meals); // Nutrients return exactly, even after a tiny rounded portion.
    const afterRow = await db.manager.findOneByOrFail(
      NutritionMealEntryEntity,
      { userId: owner, id: original.id }
    );
    expect(afterRow.position).toBe(originalRow.position);
    expect(afterRow.createdAt).toEqual(originalRow.createdAt);
  });
  it('supports native units, scales explicit pauta quantities and rejects foreign, invalid or conflicting edits atomically', async () => {
    const owner = randomUUID();
    const stranger = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    await service.savePlan(owner, {
      name: 'Pauta',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'powder',
          name: 'Proteína',
          foodIds: [],
          aliases: [],
          referenceAmount: 30,
          unit: 'g',
          free: false,
          notes: '',
          contributions: [{ group: 'protein', portions: 1 }],
        },
      ],
    });
    const original = {
      ...meal(),
      amountGrams: 0.5,
      quantity: { amount: 0.5, unit: 'scoop' as const },
      calories: 60,
      protein: 10,
      carbs: 1,
      fat: 0.5,
      pautaSelection: {
        ruleId: 'powder',
        quantity: { amount: 15, unit: 'g' as const },
      },
    };
    await service.addMeals(owner, today, [original]);
    const input = {
      quantity: { amount: 1, unit: 'scoop' as const },
      expectedQuantity: { amount: 0.5, unit: 'scoop' as const },
    };
    const edited = await service.updateMealQuantity(
      owner,
      today,
      original.id,
      input
    );
    expect(edited.meals[0]).toMatchObject({
      amountGrams: 1,
      quantity: { amount: 1, unit: 'scoop' },
      calories: 120,
      protein: 20,
      pautaSelection: { quantity: { amount: 30, unit: 'g' } },
      pauta: { contributions: [{ group: 'protein', portions: 1 }] },
    });
    await expect(
      service.updateMealQuantity(stranger, today, original.id, input)
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.updateMealQuantity(owner, '2020-01-01', original.id, input)
    ).rejects.toMatchObject({ status: 404 });
    const path = `/days/${today}/meals/${original.id}/quantity`;
    for (const body of [
      { ...input, quantity: { amount: 2, unit: 'g' } },
      { ...input, quantity: { amount: 0, unit: 'scoop' } },
      { ...input, calories: 100 },
      { ...input, userId: stranger },
      { ...input, quantityReference: {} },
    ]) {
      expect(
        (
          await call(path, {
            method: 'PUT',
            headers: { 'x-user-id': owner },
            body: JSON.stringify(body),
          })
        ).status
      ).toBe(400);
    }
    expect(
      (
        await fetch(origin + '/api/me' + path, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        })
      ).status
    ).toBe(401);
    const concurrent = await Promise.allSettled(
      [2, 3].map((amount) =>
        service.updateMealQuantity(owner, today, original.id, {
          quantity: { amount, unit: 'scoop' },
          expectedQuantity: { amount: 1, unit: 'scoop' },
        })
      )
    );
    expect(
      concurrent.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      concurrent.filter((result) => result.status === 'rejected')
    ).toHaveLength(1);
    // Bounds failures roll back both the food update and any plan binding.
    const tiny = { ...meal(), amountGrams: 0.01, calories: 99999 };
    await service.addMeals(owner, today, [tiny]);
    await expect(
      service.updateMealQuantity(owner, today, tiny.id, {
        quantity: { amount: 20000, unit: 'g' },
        expectedQuantity: { amount: 0.01, unit: 'g' },
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(
      (await service.getDay(owner, today)).meals.find(
        (entry) => entry.id === tiny.id
      )?.calories
    ).toBe(99999);
  });
  it('classifies a saved branded product atomically, preserving frozen days and reusing its reference for future consumption', async () => {
    const owner = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const future = new Date(today + 'T12:00:00Z');
    future.setUTCDate(future.getUTCDate() + 1);
    const tomorrow = future.toISOString().slice(0, 10);
    const planInput = {
      name: 'Pauta original',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: null,
        fats: 2,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'original',
          name: 'Carne',
          foodIds: ['own-food'],
          aliases: [],
          referenceAmount: 50,
          unit: 'g' as const,
          free: false,
          notes: '',
          contributions: [{ group: 'protein' as const, portions: 1 }],
        },
      ],
    };
    await service.savePlan(owner, planInput);
    const mustard = {
      ...meal(),
      foodId: 'ai-mustard',
      foodName: 'Mostaza',
      amountGrams: 30,
      quantity: { amount: 30, unit: 'g' as const },
      calories: 18,
      protein: 1.2,
      carbs: 1.5,
      fat: 0.8,
    };
    const sibling = meal();
    await service.addMeals(owner, today, [mustard, sibling]);
    await service.addMeals(owner, tomorrow, [{ ...meal(), id: randomUUID() }]);
    await service.changeWater(owner, today, {
      operationId: randomUUID(),
      amountMl: 250,
    });
    const frozenFuture = await service.getDay(owner, tomorrow);
    const before = await service.getDay(owner, today);
    await service.savePlan(owner, {
      ...planInput,
      targets: { ...planInput.targets, protein: 12 },
    });
    const product = {
      ...food,
      id: 'heinz-mustard',
      name: 'Mostaza Heinz',
      brand: 'Heinz',
      servingSizeGrams: 100,
      calories: 90,
      protein: 5,
      carbs: 10,
      fat: 3,
      isCustom: true,
    };
    await service.saveFood(owner, product);
    const input: ProductEquivalenceInput = {
      productId: product.id,
      expectedPlanVersion: 2,
      expectedDayPlanVersion: 1,
      expectedQuantity: { amount: 30, unit: 'g' },
      equivalence: {
        referenceAmount: 15,
        unit: 'g',
        contributions: [{ group: 'fats', portions: 0.25 }],
        free: false,
        notes:
          'Referencia de prueba ingresada explícitamente; no es una recomendación.',
      },
    };
    const route = `/days/${today}/meals/${mustard.id}/product-equivalence`;
    const response = await call(route, {
      method: 'PUT',
      headers: { 'x-user-id': owner },
      body: JSON.stringify(input),
    });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(productEquivalenceResultSchema.safeParse(result).success).toBe(true);
    expect(result.account.nutritionPlan.version).toBe(3);
    expect(result.account.nutritionPlan.targets.protein).toBe(12);
    expect(result.day.nutritionPlan.version).toBe(1);
    expect(result.day.nutritionPlan.targets.protein).toBe(10);
    expect(result.day.meals[0]).toMatchObject({
      id: mustard.id,
      foodId: 'ai-mustard',
      calories: 18,
      protein: 1.2,
      amountGrams: 30,
      pauta: {
        status: 'matched',
        ruleName: product.name,
        contributions: [{ group: 'fats', portions: 0.5 }],
      },
    });
    expect(result.day.meals[1]).toEqual(before.meals[1]);
    expect(result.day.waterIntakeMl).toBe(250);
    expect(await service.getDay(owner, tomorrow)).toEqual(frozenFuture);
    await expect(
      service.classifyProduct(owner, today, mustard.id, input)
    ).rejects.toMatchObject({ status: 409 });
    // New consumes of this saved product resolve automatically in an unbound day.
    const later = new Date(future);
    later.setUTCDate(later.getUTCDate() + 1);
    const newDay = later.toISOString().slice(0, 10);
    const reused = await service.addMeals(owner, newDay, [
      {
        ...mustard,
        id: randomUUID(),
        foodId: product.id,
        foodName: product.name,
      },
    ]);
    expect(reused.meals[0].pauta?.contributions).toEqual([
      { group: 'fats', portions: 0.5 },
    ]);
    // A later reference has a distinct identity and must not corrupt earlier entries.
    const second = { ...mustard, id: randomUUID() };
    await service.addMeals(owner, today, [second]);
    await service.classifyProduct(owner, today, second.id, {
      ...input,
      expectedPlanVersion: 3,
      equivalence: {
        ...input.equivalence,
        contributions: [{ group: 'fats', portions: 0.5 }],
      },
    });
    const edited = await service.updateMealQuantity(owner, today, mustard.id, {
      quantity: { amount: 15, unit: 'g' },
      expectedQuantity: { amount: 30, unit: 'g' },
    });
    expect(edited.meals[0].pauta?.contributions).toEqual([
      { group: 'fats', portions: 0.25 },
    ]);
    expect(
      edited.meals.find((entry) => entry.id === second.id)?.pauta?.contributions
    ).toEqual([{ group: 'fats', portions: 1 }]);
    await db.destroy();
    await db.initialize();
    expect(
      (await service.getDay(owner, today)).meals[0].pauta?.contributions
    ).toEqual([{ group: 'fats', portions: 0.25 }]);
  });
  it('rejects foreign products, invalid equivalences, stale quantities and unit mismatches without partial plan writes', async () => {
    const owner = randomUUID(),
      foreign = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    await service.savePlan(owner, {
      name: 'Plan',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'base',
          name: 'Base',
          foodIds: [],
          aliases: [],
          referenceAmount: 50,
          unit: 'g',
          free: false,
          notes: '',
          contributions: [{ group: 'protein', portions: 1 }],
        },
      ],
    });
    const item = meal();
    await service.addMeals(owner, today, [item]);
    await service.saveFood(foreign, { ...food, id: 'foreign-product' });
    await service.saveFood(owner, food);
    const input: ProductEquivalenceInput = {
      productId: food.id,
      expectedPlanVersion: 1,
      expectedDayPlanVersion: 1,
      expectedQuantity: { amount: item.amountGrams, unit: 'g' },
      equivalence: {
        referenceAmount: 1,
        unit: 'ml',
        free: false,
        notes: '',
        contributions: [{ group: 'fats', portions: 1 }],
      },
    };
    await expect(
      service.classifyProduct(owner, today, item.id, {
        ...input,
        productId: 'foreign-product',
      })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.classifyProduct(foreign, today, item.id, input)
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.classifyProduct(owner, today, item.id, input)
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.classifyProduct(owner, today, item.id, {
        ...input,
        expectedQuantity: { amount: 1, unit: 'g' },
      })
    ).rejects.toMatchObject({ status: 409 });
    for (const body of [
      { ...input, userId: foreign },
      { ...input, equivalence: { ...input.equivalence, contributions: [] } },
      { ...input, equivalence: { ...input.equivalence, free: true } },
      { ...input, equivalence: { ...input.equivalence, referenceAmount: 0 } },
    ]) {
      expect(
        (
          await call(`/days/${today}/meals/${item.id}/product-equivalence`, {
            method: 'PUT',
            headers: { 'x-user-id': owner },
            body: JSON.stringify(body),
          })
        ).status
      ).toBe(400);
    }
    expect((await service.getAccount(owner)).nutritionPlan?.version).toBe(1);
    const result = await service.classifyProduct(owner, today, item.id, {
      ...input,
      quantity: { amount: 2, unit: 'ml' },
    });
    expect(result.day.meals[0].pauta?.contributions).toEqual([
      { group: 'fats', portions: 2 },
    ]);
    expect(result.day.meals[0].amountGrams).toBe(item.amountGrams);
  });
  it('suggests only owned stored rules, checks versions, and leaves all persisted records untouched', async () => {
    const owner = randomUUID(),
      stranger = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const plan: NutritionPlanInput = {
      name: 'Plan de prueba',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: 4,
        fats: 2,
        dairy: 3,
        fruits: 3,
        veggies: null,
        supplements: 0,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'carne-ref',
          name: 'Carne',
          foodIds: [food.id],
          aliases: [],
          referenceAmount: 50,
          unit: 'g',
          free: false,
          contributions: [{ group: 'protein', portions: 1 }],
          notes: 'Referencia de prueba.',
        },
      ],
    };
    await service.savePlan(owner, plan);
    await service.saveFood(owner, food);
    const item = meal();
    await service.addMeals(owner, today, [item]);
    await service.savePlan(owner, {
      ...plan,
      name: 'Nueva versión',
      targets: { ...plan.targets, protein: 12 },
    });
    const beforeDay = await service.getDay(owner, today),
      beforeAccount = await service.getAccount(owner);
    const path = `/days/${today}/meals/${item.id}/equivalence-suggestions`;
    const body = {
      productId: food.id,
      dayPlanVersion: 1,
      catalogPlanVersion: 2,
      useAi: false,
    };
    const post = (input: unknown, userId: string = owner) =>
      call(path, {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: JSON.stringify(input),
      });
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const result = equivalenceSuggestionsSchema.parse(await response.json());
    expect(result.suggestions[0]).toMatchObject({
      origin: 'day',
      rule: { id: 'carne-ref', referenceAmount: 50 },
    });
    expect(result.basis).toMatchObject({
      dayPlanVersion: 1,
      catalogPlanVersion: 2,
    });
    expect((await post({ ...body, userId: stranger })).status).toBe(400);
    expect((await post({ ...body, referenceAmount: 1 })).status).toBe(400);
    expect((await post({ ...body, catalogPlanVersion: 1 })).status).toBe(409);
    expect((await post({ ...body, dayPlanVersion: 2 })).status).toBe(409);
    expect((await post({ ...body, productId: 'foreign' })).status).toBe(404);
    expect((await post(body, stranger)).status).toBe(404);
    expect((await post(body, 'invalid')).status).toBe(401);
    expect(await service.getDay(owner, today)).toEqual(beforeDay);
    expect(await service.getAccount(owner)).toEqual(beforeAccount);
  });
  it('configures an owned product without a meal and preserves frozen diaries, nutrients and plan targets', async () => {
    const owner = randomUUID(),
      foreign = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const tomorrow = new Date(
      new Date(today + 'T00:00:00Z').getTime() + 86400000
    )
      .toISOString()
      .slice(0, 10);
    const product = { ...food, name: 'Carne marca propia' };
    await service.saveFood(owner, product);
    const path = `/foods/${product.id}/equivalence`;
    const input = {
      expectedPlanVersion: 1,
      equivalence: {
        referenceAmount: 100,
        unit: 'g',
        free: false,
        contributions: [{ group: 'protein', portions: 2 }],
        notes: 'Referencia confirmada de prueba.',
      },
    };
    const put = (body: unknown, userId: string = owner) =>
      call(path, {
        method: 'PUT',
        headers: { 'x-user-id': userId },
        body: JSON.stringify(body),
      });
    expect((await put(input)).status).toBe(400);
    const pending = await call(`/foods/${product.id}/equivalence-suggestions`, {
      method: 'POST',
      headers: { 'x-user-id': owner },
      body: JSON.stringify({ catalogPlanVersion: null, useAi: true }),
    });
    expect(pending.status).toBe(200);
    expect(
      equivalenceSuggestionsSchema.parse(await pending.json())
    ).toMatchObject({
      status: 'insufficient',
      source: 'saved',
      basis: { mealId: null, dayPlanVersion: null, catalogPlanVersion: null },
    });
    expect(rankEquivalences).not.toHaveBeenCalled();
    await service.savePlan(owner, {
      name: 'Pauta de prueba',
      startsOn: today,
      enabled: true,
      targets: {
        protein: 10,
        carbs: 4,
        fats: 2,
        dairy: 3,
        fruits: 3,
        veggies: null,
        supplements: 0,
      },
      waterTargetMl: 2000,
      waterIsMinimum: false,
      rules: [
        {
          id: 'carne-base',
          name: 'Carne',
          foodIds: [],
          aliases: [],
          referenceAmount: 50,
          unit: 'g',
          free: false,
          contributions: [{ group: 'protein', portions: 1 }],
          notes: '',
        },
      ],
    });
    await service.addMeals(owner, today, [meal()]);
    await service.changeWater(owner, today, {
      operationId: randomUUID(),
      amountMl: 500,
    });
    const before = await service.getDay(owner, today),
      account = await service.getAccount(owner);
    const saved = await put(input);
    expect(saved.status).toBe(200);
    const result = await saved.json();
    expect(result.customFoods).toEqual(account.customFoods);
    expect(result.nutritionPlan).toMatchObject({
      version: 2,
      targets: account.nutritionPlan?.targets,
      startsOn: today,
    });
    expect(result.nutritionPlan.rules.at(-1)).toMatchObject({
      foodIds: [product.id],
      name: product.name,
      ...input.equivalence,
    });
    expect(await service.getDay(owner, today)).toEqual(before);
    const suggested = await call(
      `/foods/${product.id}/equivalence-suggestions`,
      {
        method: 'POST',
        headers: { 'x-user-id': owner },
        body: JSON.stringify({ catalogPlanVersion: 2, useAi: false }),
      }
    );
    expect(suggested.headers.get('cache-control')).toBe('no-store');
    expect(
      equivalenceSuggestionsSchema.parse(await suggested.json()).suggestions[0]
    ).toMatchObject({
      origin: 'catalog',
      match: 'exact',
      rule: { foodIds: [product.id], referenceAmount: 100 },
    });
    await service.addMeals(owner, tomorrow, [
      { ...meal(), foodName: product.name },
    ]);
    expect(
      (await service.getDay(owner, tomorrow)).meals[0].pauta?.contributions
    ).toEqual([{ group: 'protein', portions: 4 }]);
    expect((await put(input)).status).toBe(409);
    expect((await put({ ...input, userId: foreign })).status).toBe(400);
    expect(
      (
        await put({
          ...input,
          expectedPlanVersion: 2,
          equivalence: { ...input.equivalence, free: true },
        })
      ).status
    ).toBe(400);
    expect((await put(input, foreign)).status).toBe(404);
    expect(
      (
        await call(`/foods/foreign/equivalence`, {
          method: 'PUT',
          headers: { 'x-user-id': owner },
          body: JSON.stringify(input),
        })
      ).status
    ).toBe(404);
    expect(
      (
        await call(`/foods/${product.id}/equivalence-suggestions`, {
          method: 'POST',
          headers: { 'x-user-id': foreign },
          body: JSON.stringify({ catalogPlanVersion: 2, useAi: false }),
        })
      ).status
    ).toBe(404);
    expect((await service.getAccount(owner)).nutritionPlan?.version).toBe(2);
  });
  it('persists the complete reusable template, accepts cup quantities and keeps account copies and frozen days independent', async () => {
    const owner = randomUUID(),
      other = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const input = createPautaTemplate(today);
    const saved = await call('/plan', {
      method: 'PUT',
      headers: { 'x-user-id': owner },
      body: JSON.stringify(input),
    });
    expect(saved.status).toBe(200);
    const account = await saved.json();
    expect(account.nutritionPlan.rules).toHaveLength(133);
    expect(account.customFoods).toEqual([]);
    expect(account.goals).toBeNull();
    expect((await service.getAccount(other)).nutritionPlan).toBeNull();
    const berries = {
      ...meal(),
      foodId: 'berries',
      foodName: 'Arándanos',
      amountGrams: 125,
      quantity: { amount: 125, unit: 'g' as const },
    };
    const added = await call(`/days/${today}/meals`, {
      method: 'POST',
      headers: { 'x-user-id': owner },
      body: JSON.stringify({ entries: [berries] }),
    });
    expect(added.status).toBe(201);
    expect((await added.json()).meals[0].pauta.status).toBe('pending');
    const classified = await call(`/days/${today}/meals/${berries.id}/pauta`, {
      method: 'PUT',
      headers: { 'x-user-id': owner },
      body: JSON.stringify({
        ruleId: 'meds-arandanos',
        quantity: { amount: 0.5, unit: 'cup' },
      }),
    });
    expect(classified.status).toBe(200);
    const day = dailyLogSchema.parse(await classified.json());
    expect(day.meals[0]).toMatchObject({
      amountGrams: 125,
      calories: berries.calories,
      protein: berries.protein,
      pauta: {
        status: 'matched',
        contributions: [{ group: 'fruits', portions: 0.5 }],
      },
    });
    const secondCopy = createPautaTemplate(today);
    secondCopy.targets.protein = 8;
    await service.savePlan(other, secondCopy);
    await service.savePlan(owner, {
      ...input,
      targets: { ...input.targets, protein: 12 },
    });
    expect(
      (await service.getAccount(other)).nutritionPlan?.targets.protein
    ).toBe(8);
    expect(
      (await service.getAccount(owner)).nutritionPlan?.targets.protein
    ).toBe(12);
    expect(await service.getDay(owner, today)).toEqual(day);
    expect(createPautaTemplate(today).targets.protein).toBe(10);
  });
  it('proposes a sourced mustard equivalence through HTTP without mutations, then persists it only on confirmation and reuses it for future product entries', async () => {
    const owner = randomUUID();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    await service.savePlan(owner, createPautaTemplate(today));
    const product = {
      ...food,
      id: 'mustard-reviewed',
      name: 'Mostaza Heinz',
      brand: 'Heinz',
      calories: 54.2,
      protein: 3.5,
      carbs: 6,
      fat: 1.8,
    };
    await service.saveFood(owner, product);
    const consumed = {
      ...meal(),
      foodId: 'ai-mustard',
      foodName: 'mostaza',
      amountGrams: 45,
      quantity: { amount: 45, unit: 'g' as const },
      calories: 29,
      protein: 1.8,
      carbs: 2.3,
      fat: 1.2,
    };
    await service.addMeals(owner, today, [consumed]);
    const before = await service.getDay(owner, today),
      account = await service.getAccount(owner);
    const post = await call(
      `/days/${today}/meals/${consumed.id}/equivalence-suggestions`,
      {
        method: 'POST',
        headers: { 'x-user-id': owner },
        body: JSON.stringify({
          productId: product.id,
          dayPlanVersion: 1,
          catalogPlanVersion: 1,
          useAi: false,
        }),
      }
    );
    expect(post.status).toBe(200);
    const result = equivalenceSuggestionsSchema.parse(await post.json());
    expect(result).toMatchObject({
      source: 'reference',
      suggestions: [
        { origin: 'estimate', rule: { free: true, contributions: [] } },
      ],
    });
    expect(await service.getAccount(owner)).toEqual(account);
    expect(await service.getDay(owner, today)).toEqual(before);
    const rule = result.suggestions[0].rule;
    const saved = await call(
      `/days/${today}/meals/${consumed.id}/product-equivalence`,
      {
        method: 'PUT',
        headers: { 'x-user-id': owner },
        body: JSON.stringify({
          productId: product.id,
          expectedPlanVersion: 1,
          expectedDayPlanVersion: 1,
          expectedQuantity: consumed.quantity,
          equivalence: {
            referenceAmount: rule.referenceAmount,
            unit: rule.unit,
            free: rule.free,
            contributions: rule.contributions,
            notes: rule.notes,
          },
        }),
      }
    );
    expect(saved.status).toBe(200);
    const classified = productEquivalenceResultSchema.parse(await saved.json());
    expect(classified.day.meals[0]).toMatchObject({
      ...consumed,
      pauta: { status: 'free' },
    });
    expect(classified.account.nutritionPlan?.rules).toHaveLength(134);
    expect(classified.account.nutritionPlan?.targets).toEqual(
      account.nutritionPlan?.targets
    );
    expect(classified.account.nutritionPlan?.rules.at(-1)?.notes).toContain(
      'uclahealth.org'
    );
    const tomorrow = new Date(
      new Date(today + 'T00:00:00Z').getTime() + 86400000
    )
      .toISOString()
      .slice(0, 10);
    const future = await service.addMeals(owner, tomorrow, [
      {
        ...consumed,
        id: randomUUID(),
        foodId: product.id,
        foodName: product.name,
      },
    ]);
    expect(future.meals[0].pauta?.status).toBe('free');
  });
  it('survives a new database connection and runs migration down/up cleanly', async () => {
    await db.destroy();
    await db.initialize();
    expect((await service.getAccount(a)).profile?.name).toBe('Persona real');
    expect((await service.getDay(a, date)).meals).toHaveLength(9);
    expect(await db.runMigrations()).toEqual([]);
    await db.undoLastMigration();
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS count FROM information_schema.columns WHERE table_name = 'nutrition_daily_logs' AND column_name = 'product_rules'"
        )
      )[0].count
    ).toBe(0);
    await db.undoLastMigration();
    expect(
      (await db.query("SELECT to_regclass('nutrition_plans') AS name"))[0].name
    ).toBeNull();
    await db.undoLastMigration();
    expect(
      (
        await db.query("SELECT to_regclass('nutrition_profiles') AS table_name")
      )[0].table_name
    ).toBeNull();
    await db.runMigrations();
    expect((await service.getAccount(a)).profile).toBeNull();
  });
});
