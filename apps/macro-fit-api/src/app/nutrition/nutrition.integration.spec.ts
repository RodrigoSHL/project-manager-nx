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
} from '@project-manager/macrofit-contracts';
import { nutritionEntities } from './entities/nutrition.entity';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { AddNutritionPlans1792742400000 } from '../../migrations/1792742400000-AddNutritionPlans';
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
    ],
    synchronize: false,
  });
  let service: NutritionService;
  let app: INestApplication;
  let origin: string;
  beforeAll(async () => {
    await db.initialize();
    await db.runMigrations();
    const module = await Test.createTestingModule({
      controllers: [NutritionController],
      providers: [NutritionService, { provide: DataSource, useValue: db }],
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
  it('survives a new database connection and runs migration down/up cleanly', async () => {
    await db.destroy();
    await db.initialize();
    expect((await service.getAccount(a)).profile?.name).toBe('Persona real');
    expect((await service.getDay(a, date)).meals).toHaveLength(9);
    expect(await db.runMigrations()).toEqual([]);
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
