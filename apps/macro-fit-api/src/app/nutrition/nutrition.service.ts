import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  DailyLog,
  FoodItem,
  ImportData,
  MealEntry,
  MealTemplate,
  NutritionAccount,
  Settings,
  WaterChange,
} from '@project-manager/macrofit-contracts';
import {
  NutritionDailyLogEntity,
  NutritionFoodEntity,
  NutritionMealEntryEntity,
  NutritionProfileEntity,
  NutritionTemplateEntity,
  NutritionWaterOperationEntity,
} from './entities/nutrition.entity';

@Injectable()
export class NutritionService {
  constructor(private readonly dataSource: DataSource) {}

  // Locks live in PostgreSQL, so simultaneous tabs and API replicas cannot lose updates.
  private transaction<T>(
    userId: string,
    work: (manager: EntityManager) => Promise<T>
  ) {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [userId]
      );
      return work(manager);
    });
  }

  private async account(
    manager: EntityManager,
    userId: string
  ): Promise<NutritionAccount> {
    const settings = await manager.findOneBy(NutritionProfileEntity, {
      userId,
    });
    const foods = await manager.findBy(NutritionFoodEntity, { userId });
    const templates = await manager.findBy(NutritionTemplateEntity, { userId });
    return {
      profile: settings?.profile ?? null,
      goals: settings?.goals ?? null,
      customFoods: foods.map((item) => item.data),
      customTemplates: templates.map((item) => item.data),
      legacyImported: settings?.legacyImported ?? false,
    };
  }
  getAccount(userId: string) {
    return this.transaction(userId, (manager) => this.account(manager, userId));
  }
  saveSettings(userId: string, input: Settings) {
    return this.transaction(userId, async (manager) => {
      const previous = await manager.findOneBy(NutritionProfileEntity, {
        userId,
      });
      await manager.save(NutritionProfileEntity, {
        userId,
        ...input,
        legacyImported: previous?.legacyImported ?? false,
      });
      return this.account(manager, userId);
    });
  }

  private async daily(
    manager: EntityManager,
    userId: string,
    date: string
  ): Promise<DailyLog> {
    const log = await manager.findOneBy(NutritionDailyLogEntity, {
      userId,
      date,
    });
    const entries = await manager.find(NutritionMealEntryEntity, {
      where: { userId, date },
      order: { position: 'ASC' },
    });
    return {
      date,
      meals: entries.map((entry) => entry.data),
      waterIntakeMl: log?.waterIntakeMl ?? 0,
      ...(log?.notes != null ? { notes: log.notes } : {}),
      ...(log?.weightCheckKg != null
        ? { weightCheckKg: log.weightCheckKg }
        : {}),
    };
  }
  getDay(userId: string, date: string) {
    return this.transaction(userId, (manager) =>
      this.daily(manager, userId, date)
    );
  }
  private async ensureDay(
    manager: EntityManager,
    userId: string,
    date: string
  ) {
    await manager
      .createQueryBuilder()
      .insert()
      .into(NutritionDailyLogEntity)
      .values({ userId, date })
      .orIgnore()
      .execute();
  }
  private async insertEntries(
    manager: EntityManager,
    userId: string,
    date: string,
    entries: MealEntry[]
  ) {
    for (const entry of entries) {
      const previous = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        id: entry.id,
      });
      if (previous) {
        // Compare JSONB values in PostgreSQL; object key order is irrelevant.
        const [same] = await manager.query(
          'SELECT date = $3::date AND data = $4::jsonb AS matches FROM nutrition_meal_entries WHERE user_id = $1 AND id = $2',
          [userId, entry.id, date, JSON.stringify(entry)]
        );
        if (!same?.matches)
          throw new ConflictException(
            'El identificador de la comida ya fue utilizado.'
          );
      } else {
        await manager.insert(NutritionMealEntryEntity, {
          userId,
          id: entry.id,
          date,
          data: entry,
        });
      }
    }
  }
  addMeals(userId: string, date: string, entries: MealEntry[]) {
    return this.transaction(userId, async (manager) => {
      await this.ensureDay(manager, userId, date);
      await this.insertEntries(manager, userId, date, entries);
      if (
        (await manager.countBy(NutritionMealEntryEntity, { userId, date })) >
        1000
      ) {
        throw new BadRequestException(
          'Un diario admite hasta 1000 alimentos por día.'
        );
      }
      return this.daily(manager, userId, date);
    });
  }
  removeMeal(userId: string, date: string, id: string) {
    return this.transaction(userId, async (manager) => {
      await manager.delete(NutritionMealEntryEntity, { userId, date, id });
      return this.daily(manager, userId, date);
    });
  }
  changeWater(userId: string, date: string, input: WaterChange) {
    return this.transaction(userId, async (manager) => {
      const { operationId, ...change } = input;
      const previous = await manager.findOneBy(NutritionWaterOperationEntity, {
        userId,
        id: operationId,
      });
      if (previous) {
        if (
          previous.date !== date ||
          previous.data.amountMl !== change.amountMl ||
          Boolean(previous.data.reset) !== Boolean(change.reset)
        )
          throw new ConflictException('La operación de agua ya fue utilizada.');
      } else {
        await this.ensureDay(manager, userId, date);
        await manager.query(
          'UPDATE nutrition_daily_logs SET water_intake_ml = CASE WHEN $3 THEN 0 ELSE LEAST(30000, GREATEST(0, water_intake_ml + $4)) END WHERE user_id = $1 AND date = $2',
          [userId, date, Boolean(change.reset), change.amountMl]
        );
        await manager.insert(NutritionWaterOperationEntity, {
          userId,
          id: operationId,
          date,
          data: change,
        });
      }
      return this.daily(manager, userId, date);
    });
  }
  saveFood(userId: string, food: FoodItem) {
    return this.transaction(userId, async (manager) => {
      await manager.save(NutritionFoodEntity, {
        userId,
        id: food.id,
        data: { ...food, isCustom: true },
      });
      return this.account(manager, userId);
    });
  }
  saveTemplate(userId: string, template: MealTemplate) {
    return this.transaction(userId, async (manager) => {
      await manager.save(NutritionTemplateEntity, {
        userId,
        id: template.id,
        data: { ...template, isCustom: true },
      });
      return this.account(manager, userId);
    });
  }
  removeCatalogItem(userId: string, kind: 'foods' | 'templates', id: string) {
    return this.transaction(userId, async (manager) => {
      const result = await manager.delete(
        kind === 'foods' ? NutritionFoodEntity : NutritionTemplateEntity,
        { userId, id }
      );
      if (!result.affected)
        throw new NotFoundException('Registro no encontrado.');
      return this.account(manager, userId);
    });
  }
  importLegacy(userId: string, input: ImportData) {
    return this.transaction(userId, async (manager) => {
      const previous = await manager.findOneBy(NutritionProfileEntity, {
        userId,
      });
      if (previous?.legacyImported) return this.account(manager, userId);
      await manager.save(NutritionProfileEntity, {
        userId,
        profile: previous?.profile ?? input.settings?.profile ?? null,
        goals: previous?.goals ?? input.settings?.goals ?? null,
        legacyImported: true,
      });
      for (const food of input.foods) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(NutritionFoodEntity)
          .values({ userId, id: food.id, data: { ...food, isCustom: true } })
          .orIgnore()
          .execute();
      }
      for (const template of input.templates) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(NutritionTemplateEntity)
          .values({
            userId,
            id: template.id,
            data: { ...template, isCustom: true },
          })
          .orIgnore()
          .execute();
      }
      for (const log of input.logs) {
        // A day already saved in the backend is authoritative. Never overwrite it on import.
        if (
          await manager.existsBy(NutritionDailyLogEntity, {
            userId,
            date: log.date,
          })
        )
          continue;
        await manager.insert(NutritionDailyLogEntity, {
          userId,
          date: log.date,
          waterIntakeMl: log.waterIntakeMl,
          notes: log.notes,
          weightCheckKg: log.weightCheckKg,
        });
        await this.insertEntries(manager, userId, log.date, log.meals);
      }
      return this.account(manager, userId);
    });
  }
}
