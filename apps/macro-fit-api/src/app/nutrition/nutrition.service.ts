import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, LessThanOrEqual } from 'typeorm';
import {
  EquivalenceSuggestionRequest,
  ProductSuggestionRequest,
  SaveProductEquivalence,
  DailyLog,
  FoodItem,
  ImportData,
  MealEntry,
  MealTemplate,
  NutritionAccount,
  Settings,
  WaterChange,
  NutritionPlan,
  SaveNutritionPlanInput,
  PautaSelection,
  calculatePauta,
  isNutritionPlanConfigured,
  UpdateMealQuantity,
  mealEntrySchema,
  ProductEquivalenceInput,
  ProductEquivalenceResult,
  PautaRule,
  nutritionPlanSchema,
} from '@project-manager/macrofit-contracts';
import {
  NutritionDailyLogEntity,
  NutritionFoodEntity,
  NutritionMealEntryEntity,
  NutritionProfileEntity,
  NutritionTemplateEntity,
  NutritionWaterOperationEntity,
  NutritionPlanEntity,
} from './entities/nutrition.entity';

// Kept only in the stored JSONB, never accepted from or returned to the browser.
// Repeated corrections use the same reference to avoid accumulating rounding loss.
type StoredMealEntry = MealEntry & {
  quantityReference?: Pick<
    MealEntry,
    'amountGrams' | 'calories' | 'protein' | 'carbs' | 'fat' | 'portionsCount'
  >;
};

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
    const plan = await manager.findOne(NutritionPlanEntity, {
      where: { userId },
      order: { version: 'DESC' },
    });
    return {
      profile: settings?.profile ?? null,
      goals: settings?.goals ?? null,
      customFoods: foods.map((item) => item.data),
      customTemplates: templates.map((item) => item.data),
      legacyImported: settings?.legacyImported ?? false,
      nutritionPlan: plan?.data ?? null,
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

  savePlan(userId: string, input: SaveNutritionPlanInput) {
    return this.transaction(userId, async (manager) => {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      if (input.startsOn < today)
        throw new BadRequestException(
          'La pauta debe comenzar hoy o en una fecha futura. El historial se conserva.'
        );
      if (input.enabled && !isNutritionPlanConfigured(input))
        throw new BadRequestException(
          'Carga la referencia o agrega metas y equivalencias antes de activar la pauta.'
        );
      if (input.applyToToday && (!input.enabled || input.startsOn !== today))
        throw new BadRequestException(
          'Solo puedes aplicar a hoy una pauta activa que comience hoy.'
        );
      const { applyToToday, ...definition } = input;
      const previous = await manager.findOne(NutritionPlanEntity, {
        where: { userId },
        order: { version: 'DESC' },
      });
      const plan: NutritionPlan = {
        ...definition,
        version: (previous?.version ?? 0) + 1,
        createdAt: new Date().toISOString(),
      };
      await manager.insert(NutritionPlanEntity, {
        userId,
        version: plan.version,
        startsOn: plan.startsOn,
        data: plan,
      });
      if (applyToToday) {
        await this.ensureDay(manager, userId, today);
        await manager.update(
          NutritionDailyLogEntity,
          { userId, date: today },
          { planVersion: plan.version, productRules: [] }
        );
        const entries = await manager.findBy(NutritionMealEntryEntity, {
          userId,
          date: today,
        });
        for (const row of entries) {
          const selection = row.data.pautaSelection;
          const obsolete =
            selection?.ruleId &&
            !plan.rules.some((rule) => rule.id === selection.ruleId);
          // A removed manual rule remains pending; never silently guess a replacement.
          const nextSelection = obsolete ? { ruleId: null } : selection;
          await manager.update(
            NutritionMealEntryEntity,
            { userId, id: row.id },
            {
              data: {
                ...row.data,
                ...(obsolete ? { pautaSelection: nextSelection } : {}),
                pauta: calculatePauta(plan, row.data, nextSelection),
              },
            }
          );
        }
      }
      return this.account(manager, userId);
    });
  }

  private async dayPlan(
    manager: EntityManager,
    userId: string,
    date: string,
    version?: number | null,
    productRules: PautaRule[] = []
  ): Promise<NutritionPlan | null> {
    const plan =
      version != null
        ? await manager.findOneBy(NutritionPlanEntity, { userId, version })
        : await manager.findOne(NutritionPlanEntity, {
            where: { userId, startsOn: LessThanOrEqual(date) },
            order: { version: 'DESC' },
          });
    if (!plan?.data.enabled) return null;
    // Day-local additions keep frozen goals and all other days intact.
    let rules = plan.data.rules;
    for (const extra of productRules) {
      rules = [
        ...rules
          .filter((rule) => rule.id !== extra.id)
          .map((rule) => ({
            ...rule,
            foodIds: rule.foodIds.filter((id) => !extra.foodIds.includes(id)),
          })),
        extra,
      ];
    }
    return { ...plan.data, rules };
  }

  private async bindDayPlan(
    manager: EntityManager,
    userId: string,
    date: string
  ) {
    const log = await manager.findOneByOrFail(NutritionDailyLogEntity, {
      userId,
      date,
    });
    const plan = await this.dayPlan(
      manager,
      userId,
      date,
      log.planVersion,
      log.productRules
    );
    if (plan && log.planVersion == null)
      await manager.update(
        NutritionDailyLogEntity,
        { userId, date },
        { planVersion: plan.version }
      );
    return plan;
  }

  classifyMeal(
    userId: string,
    date: string,
    id: string,
    selection: PautaSelection
  ) {
    return this.transaction(userId, async (manager) => {
      const row = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        date,
        id,
      });
      if (!row) throw new NotFoundException('Alimento no encontrado.');
      const plan = await this.bindDayPlan(manager, userId, date);
      if (!plan)
        throw new BadRequestException('Este día no tiene una pauta activa.');
      this.validateSelection(plan, selection);
      await manager.update(
        NutritionMealEntryEntity,
        { userId, date, id },
        {
          data: {
            ...row.data,
            pautaSelection: selection,
            pauta: calculatePauta(plan, row.data, selection),
          },
        }
      );
      return this.daily(manager, userId, date);
    });
  }

  classifyProduct(
    userId: string,
    date: string,
    id: string,
    input: ProductEquivalenceInput
  ): Promise<ProductEquivalenceResult> {
    return this.transaction(userId, async (manager) => {
      const row = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        date,
        id,
      });
      if (!row) throw new NotFoundException('Consumo no encontrado.');
      const product = await manager.findOneBy(NutritionFoodEntity, {
        userId,
        id: input.productId,
      });
      if (!product)
        throw new NotFoundException('El producto no existe en tu catálogo.');
      const latest = await manager.findOne(NutritionPlanEntity, {
        where: { userId },
        order: { version: 'DESC' },
      });
      const day = await manager.findOneByOrFail(NutritionDailyLogEntity, {
        userId,
        date,
      });
      const plan = await this.bindDayPlan(manager, userId, date);
      if (!latest?.data.enabled || !plan)
        throw new BadRequestException(
          'Necesitas una pauta activa para guardar equivalencias.'
        );
      if (
        latest.version !== input.expectedPlanVersion ||
        plan.version !== input.expectedDayPlanVersion
      )
        throw new ConflictException(
          'La pauta cambió en otra sesión. Actualiza tus registros antes de clasificar.'
        );
      const quantity = row.data.quantity ?? {
        amount: row.data.amountGrams,
        unit: 'g',
      };
      if (
        quantity.amount !== input.expectedQuantity.amount ||
        quantity.unit !== input.expectedQuantity.unit
      )
        throw new ConflictException(
          'La cantidad consumida cambió. Actualiza el diario antes de clasificar.'
        );
      const rule = this.productRule(product, input.equivalence);
      const ruleId = rule.id;
      const upsertRules = (rules: PautaRule[]) =>
        this.upsertProductRule(rules, rule);
      const nextPlan: NutritionPlan = {
        ...latest.data,
        rules: upsertRules(latest.data.rules),
        version: latest.version + 1,
        createdAt: new Date().toISOString(),
      };
      if (
        !nutritionPlanSchema.safeParse(nextPlan).success ||
        upsertRules(plan.rules).length > 250
      )
        throw new BadRequestException(
          'La pauta admite hasta 250 equivalencias. Revisa sus reglas antes de agregar otra.'
        );
      const selection: PautaSelection = {
        ruleId,
        ...(input.quantity ? { quantity: input.quantity } : {}),
      };
      const preview = calculatePauta(
        { ...plan, rules: upsertRules(plan.rules) },
        row.data,
        selection
      );
      if (preview.status === 'pending')
        throw new BadRequestException(
          'Indica la cantidad consumida en la unidad de la equivalencia.'
        );
      await manager.insert(NutritionPlanEntity, {
        userId,
        version: nextPlan.version,
        startsOn: nextPlan.startsOn,
        data: nextPlan,
      });
      await manager.update(
        NutritionDailyLogEntity,
        { userId, date },
        {
          productRules: [
            ...(day.productRules ?? []).filter((item) => item.id !== ruleId),
            rule,
          ],
        }
      );
      await manager.update(
        NutritionMealEntryEntity,
        { userId, date, id },
        {
          data: { ...row.data, pautaSelection: selection, pauta: preview },
        }
      );
      return {
        account: await this.account(manager, userId),
        day: await this.daily(manager, userId, date),
      };
    });
  }

  private productRule(
    product: NutritionFoodEntity,
    equivalence: ProductEquivalenceInput['equivalence']
  ): PautaRule {
    // A changed reference gets a new identity; existing consumption snapshots stay valid.
    const id =
      'product-' +
      createHash('sha256')
        .update(JSON.stringify([product.id, product.data.name, equivalence]))
        .digest('hex')
        .slice(0, 32);
    return {
      id,
      name: product.data.name,
      foodIds: [product.id],
      aliases: [],
      ...equivalence,
    };
  }
  private upsertProductRule(rules: PautaRule[], rule: PautaRule) {
    return [
      ...rules
        .filter((item) => item.id !== rule.id)
        .map((item) => ({
          ...item,
          foodIds: item.foodIds.filter((id) => !rule.foodIds.includes(id)),
        })),
      rule,
    ];
  }
  saveProductEquivalence(
    userId: string,
    productId: string,
    input: SaveProductEquivalence
  ) {
    return this.transaction(userId, async (manager) => {
      const product = await manager.findOneBy(NutritionFoodEntity, {
        userId,
        id: productId,
      });
      if (!product)
        throw new NotFoundException('El producto no existe en tu catálogo.');
      const latest = await manager.findOne(NutritionPlanEntity, {
        where: { userId },
        order: { version: 'DESC' },
      });
      if (!latest?.data.enabled)
        throw new BadRequestException(
          'Configura una pauta activa antes de definir sus equivalencias. El producto conserva sus nutrientes.'
        );
      if (latest.version !== input.expectedPlanVersion)
        throw new ConflictException(
          'Tu pauta cambió. Actualiza tus productos antes de guardar la equivalencia.'
        );
      const rule = this.productRule(product, input.equivalence);
      const nextPlan: NutritionPlan = {
        ...latest.data,
        rules: this.upsertProductRule(latest.data.rules, rule),
        version: latest.version + 1,
        createdAt: new Date().toISOString(),
      };
      if (!nutritionPlanSchema.safeParse(nextPlan).success)
        throw new BadRequestException(
          'Revisa la equivalencia y el límite de 250 referencias de tu pauta.'
        );
      await manager.insert(NutritionPlanEntity, {
        userId,
        version: nextPlan.version,
        startsOn: nextPlan.startsOn,
        data: nextPlan,
      });
      return this.account(manager, userId);
    });
  }
  getProductEquivalenceContext(
    userId: string,
    productId: string,
    input: ProductSuggestionRequest
  ) {
    return this.transaction(userId, async (manager) => {
      const product = await manager.findOneBy(NutritionFoodEntity, {
        userId,
        id: productId,
      });
      if (!product)
        throw new NotFoundException('El producto no existe en tu catálogo.');
      const latest = await manager.findOne(NutritionPlanEntity, {
        where: { userId },
        order: { version: 'DESC' },
      });
      if ((latest?.version ?? null) !== input.catalogPlanVersion)
        throw new ConflictException(
          'Tu pauta cambió. Actualiza tus productos antes de pedir sugerencias.'
        );
      return {
        plan: latest?.data ?? null,
        food: {
          ...product.data,
          id: product.id,
          name: product.data.name,
          brand: product.data.brand,
        },
      };
    });
  }

  private validateSelection(plan: NutritionPlan, selection?: PautaSelection) {
    if (
      selection?.ruleId &&
      !plan.rules.some((rule) => rule.id === selection.ruleId)
    )
      throw new BadRequestException(
        'La equivalencia no pertenece a la pauta de este día.'
      );
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
      meals: entries.map((entry) => {
        const data: StoredMealEntry = { ...entry.data };
        delete data.quantityReference;
        return data;
      }),
      waterIntakeMl: log?.waterIntakeMl ?? 0,
      nutritionPlan: await this.dayPlan(
        manager,
        userId,
        date,
        log?.planVersion,
        log?.productRules
      ),
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
  getEquivalenceContext(
    userId: string,
    date: string,
    mealId: string,
    input: EquivalenceSuggestionRequest
  ) {
    return this.transaction(userId, async (manager) => {
      const meal = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        date,
        id: mealId,
      });
      if (!meal)
        throw new NotFoundException('No se encontró el alimento en este día.');
      const log = await manager.findOneBy(NutritionDailyLogEntity, {
        userId,
        date,
      });
      const day = await this.dayPlan(
        manager,
        userId,
        date,
        log?.planVersion,
        log?.productRules
      );
      const catalog = await manager.findOne(NutritionPlanEntity, {
        where: { userId },
        order: { version: 'DESC' },
      });
      if (
        !day ||
        day.version !== input.dayPlanVersion ||
        catalog?.version !== input.catalogPlanVersion
      )
        throw new ConflictException(
          'Tu pauta cambió. Cierra la clasificación y actualiza el diario.'
        );
      const product = input.productId
        ? await manager.findOneBy(NutritionFoodEntity, {
            userId,
            id: input.productId,
          })
        : null;
      if (input.productId && !product)
        throw new NotFoundException('No se encontró el producto en tu cuenta.');
      return {
        day,
        catalog: catalog.data,
        food: product
          ? {
              ...product.data,
              id: product.id,
              name: product.data.name,
              brand: product.data.brand,
            }
          : { id: meal.data.foodId, name: meal.data.foodName },
      };
    });
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
    entries: MealEntry[],
    plan?: NutritionPlan | null
  ) {
    for (const entry of entries) {
      const previous = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        id: entry.id,
      });
      if (previous) {
        // Compare JSONB values in PostgreSQL; object key order is irrelevant.
        const [same] = await manager.query(
          "SELECT date = $3::date AND data - 'pauta' - 'quantityReference' = $4::jsonb - 'pauta' AS matches FROM nutrition_meal_entries WHERE user_id = $1 AND id = $2",
          [userId, entry.id, date, JSON.stringify(entry)]
        );
        if (!same?.matches)
          throw new ConflictException(
            'El identificador de la comida ya fue utilizado.'
          );
      } else {
        const input = { ...entry };
        delete input.pauta;
        if (plan) this.validateSelection(plan, entry.pautaSelection);
        await manager.insert(NutritionMealEntryEntity, {
          userId,
          id: entry.id,
          date,
          data: {
            ...input,
            ...(plan
              ? { pauta: calculatePauta(plan, input, input.pautaSelection) }
              : {}),
          },
        });
      }
    }
  }
  addMeals(userId: string, date: string, entries: MealEntry[]) {
    return this.transaction(userId, async (manager) => {
      await this.ensureDay(manager, userId, date);
      const plan = await this.bindDayPlan(manager, userId, date);
      await this.insertEntries(manager, userId, date, entries, plan);
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
  updateMealQuantity(
    userId: string,
    date: string,
    id: string,
    input: UpdateMealQuantity
  ) {
    return this.transaction(userId, async (manager) => {
      const row = await manager.findOneBy(NutritionMealEntryEntity, {
        userId,
        date,
        id,
      });
      if (!row) throw new NotFoundException('Alimento no encontrado.');
      const current: StoredMealEntry = row.data;
      const currentQuantity = current.quantity ?? {
        amount: current.amountGrams,
        unit: 'g' as const,
      };
      if (
        input.quantity.unit !== currentQuantity.unit ||
        input.expectedQuantity.unit !== currentQuantity.unit
      )
        throw new BadRequestException(
          'Conserva la unidad del registro. No se convierten gramos, ml y unidades automáticamente.'
        );
      if (currentQuantity.amount === input.quantity.amount)
        return this.daily(manager, userId, date);
      if (currentQuantity.amount !== input.expectedQuantity.amount)
        throw new ConflictException(
          'La cantidad de este alimento cambió en otra sesión. Actualiza el diario antes de editarlo.'
        );
      const reference = current.quantityReference ?? {
        amountGrams: current.amountGrams,
        calories: current.calories,
        protein: current.protein,
        carbs: current.carbs,
        fat: current.fat,
        ...(current.portionsCount != null
          ? { portionsCount: current.portionsCount }
          : {}),
      };
      if (!Number.isFinite(reference.amountGrams) || reference.amountGrams <= 0)
        throw new BadRequestException(
          'Este registro no tiene una cantidad base válida para recalcular.'
        );
      const ratio = input.quantity.amount / reference.amountGrams;
      const scale = (value: number) =>
        ratio === 1 ? value : Number((value * ratio).toFixed(1));
      const selection = current.pautaSelection
        ? {
            ...current.pautaSelection,
            ...(current.pautaSelection.quantity
              ? {
                  quantity: {
                    ...current.pautaSelection.quantity,
                    amount:
                      (current.pautaSelection.quantity.amount *
                        input.quantity.amount) /
                      currentQuantity.amount,
                  },
                }
              : {}),
          }
        : undefined;
      const plan = await this.bindDayPlan(manager, userId, date);
      const data: StoredMealEntry = {
        ...current,
        amountGrams: input.quantity.amount,
        quantity: input.quantity,
        calories:
          ratio === 1
            ? reference.calories
            : Math.round(reference.calories * ratio),
        protein: scale(reference.protein),
        carbs: scale(reference.carbs),
        fat: scale(reference.fat),
        ...(reference.portionsCount != null
          ? { portionsCount: reference.portionsCount * ratio }
          : {}),
        ...(selection ? { pautaSelection: selection } : {}),
      };
      delete data.pauta;
      delete data.quantityReference;
      if (plan) data.pauta = calculatePauta(plan, data, selection);
      const validated = mealEntrySchema.safeParse(data);
      if (!validated.success)
        throw new BadRequestException(
          'La cantidad produce valores fuera de los límites permitidos. Revisa el valor ingresado.'
        );
      data.quantityReference = reference;
      await manager.update(
        NutritionMealEntryEntity,
        { userId, date, id },
        { data }
      );
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
      if (food.barcode) {
        const duplicate = await manager
          .createQueryBuilder(NutritionFoodEntity, 'food')
          .where('food.userId = :userId', { userId })
          .andWhere('food.id <> :id', { id: food.id })
          .andWhere("food.data ->> 'barcode' = :barcode", {
            barcode: food.barcode,
          })
          .getExists();
        if (duplicate)
          throw new ConflictException(
            'Ya tienes un producto con ese código de barras. Edita el producto existente.'
          );
      }
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
