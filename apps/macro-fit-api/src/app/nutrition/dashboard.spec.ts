import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  createPautaTemplate,
  dashboardRangeSchema,
  dashboardResponseSchema,
  MealEntry,
} from '@project-manager/macrofit-contracts';
import { NutritionService } from './nutrition.service';
import {
  NutritionDailyLogEntity,
  NutritionMealEntryEntity,
  NutritionPlanEntity,
  NutritionProfileEntity,
} from './entities/nutrition.entity';

describe('Dashboard history', () => {
  const owner = '00000000-0000-4000-8000-000000000001';
  const oldPlan = {
    ...createPautaTemplate('2026-10-01'),
    enabled: true,
    version: 1,
    createdAt: '2026-10-01T00:00:00Z',
  };
  const newPlan = {
    ...oldPlan,
    version: 2,
    startsOn: '2026-10-02',
    targets: { ...oldPlan.targets, protein: 5 },
  };
  const meal: MealEntry = {
    id: 'meal',
    mealType: 'lunch',
    foodId: 'food',
    foodName: 'Private food name',
    amountGrams: 150,
    calories: 300,
    protein: 39,
    carbs: 0,
    fat: 15,
    timestamp: '13:00',
    pauta: {
      planVersion: 1,
      status: 'matched',
      contributions: [{ group: 'protein', portions: 3 }],
    },
  };
  const find = jest.fn(async (entity: unknown) => {
    if (entity === NutritionDailyLogEntity)
      return [{ date: '2026-10-02', planVersion: 1, waterIntakeMl: 500 }];
    if (entity === NutritionMealEntryEntity)
      return [
        { date: '2026-10-02', data: meal },
        {
          date: '2026-10-02',
          data: {
            ...meal,
            id: 'pending',
            pauta: { planVersion: 1, status: 'pending', contributions: [] },
          },
        },
      ];
    if (entity === NutritionPlanEntity)
      return [
        { version: 2, startsOn: newPlan.startsOn, data: newPlan },
        { version: 1, startsOn: oldPlan.startsOn, data: oldPlan },
      ];
    throw new Error('Unexpected entity');
  });
  const manager = {
    query: jest.fn(),
    find,
    findOneBy: jest.fn(async () => null),
  };
  const transaction = jest.fn(
    async (work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager as unknown as EntityManager)
  );
  const service = new NutritionService({
    transaction,
  } as unknown as DataSource);
  beforeEach(() => jest.clearAllMocks());

  it('aggregates snapshots with the frozen plan, includes gaps, and does not return private meals or catalogs', async () => {
    const result = await service.getDashboard(
      owner,
      '2026-10-01',
      '2026-10-03'
    );
    expect(dashboardResponseSchema.safeParse(result).success).toBe(true);
    expect(result.days).toHaveLength(3);
    expect(result.days[1]).toMatchObject({
      mealCount: 2,
      totals: { calories: 600, protein: 78 },
      waterIntakeMl: 500,
      plan: {
        version: 1,
        targets: { protein: 10 },
        consumed: { protein: 3 },
        pending: 1,
      },
    });
    expect(result.days[2]).toMatchObject({
      mealCount: 0,
      plan: { version: 2, targets: { protein: 5 } },
    });
    expect(result.days[0].mealCount).toBe(0);
    expect(JSON.stringify(result)).not.toContain('Private food name');
    expect(JSON.stringify(result)).not.toContain('rules');
    expect(manager.findOneBy).toHaveBeenCalledWith(NutritionProfileEntity, {
      userId: owner,
    });
    for (const [, options] of find.mock.calls as unknown as Array<
      [unknown, { where: { userId: string } }]
    >)
      expect(options.where.userId).toBe(owner);
    expect(find).toHaveBeenCalledTimes(3);
  });
  it('rejects invalid or oversized windows before reading any database rows', async () => {
    for (const [from, to] of [
      ['2026-02-30', '2026-03-01'],
      ['2026-10-03', '2026-10-01'],
      ['2026-01-01', '2026-04-01'],
    ]) {
      expect(() => service.getDashboard(owner, from, to)).toThrow(
        BadRequestException
      );
    }
    expect(transaction).not.toHaveBeenCalled();
    expect(
      dashboardRangeSchema.safeParse({ from: '2026-01-01', to: '2026-03-31' })
        .success
    ).toBe(true);
  });
});
