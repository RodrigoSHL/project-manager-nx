import { Column, Entity, Generated, PrimaryColumn } from 'typeorm';
import {
  FoodItem,
  MacroGoals,
  MealEntry,
  MealTemplate,
  UserProfile,
  NutritionPlan,
} from '@project-manager/macrofit-contracts';

@Entity('nutrition_profiles')
export class NutritionProfileEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @Column('jsonb', { nullable: true }) profile!: UserProfile | null;
  @Column('jsonb', { nullable: true }) goals!: MacroGoals | null;
  @Column('boolean', { name: 'legacy_imported', default: false })
  legacyImported!: boolean;
}
@Entity('nutrition_daily_logs')
export class NutritionDailyLogEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('date') date!: string;
  @Column('integer', { name: 'water_intake_ml', default: 0 })
  waterIntakeMl!: number;
  @Column('text', { nullable: true }) notes!: string | null;
  @Column('double precision', { name: 'weight_check_kg', nullable: true })
  weightCheckKg!: number | null;
  @Column('integer', { name: 'plan_version', nullable: true })
  planVersion!: number | null;
}
@Entity('nutrition_plans')
export class NutritionPlanEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('integer') version!: number;
  @Column('date', { name: 'starts_on' }) startsOn!: string;
  @Column('jsonb') data!: NutritionPlan;
}
@Entity('nutrition_meal_entries')
export class NutritionMealEntryEntity {
  @Column('bigint')
  @Generated('increment')
  position!: string;
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('varchar', { length: 100 }) id!: string;
  @Column('date') date!: string;
  @Column('jsonb') data!: MealEntry;
  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
@Entity('nutrition_foods')
export class NutritionFoodEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('varchar', { length: 100 }) id!: string;
  @Column('jsonb') data!: FoodItem;
}
@Entity('nutrition_templates')
export class NutritionTemplateEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('varchar', { length: 100 }) id!: string;
  @Column('jsonb') data!: MealTemplate;
}
@Entity('nutrition_water_operations')
export class NutritionWaterOperationEntity {
  @PrimaryColumn('uuid', { name: 'user_id' }) userId!: string;
  @PrimaryColumn('uuid') id!: string;
  @Column('date') date!: string;
  @Column('jsonb') data!: { amountMl: number; reset?: boolean };
}
export const nutritionEntities = [
  NutritionPlanEntity,
  NutritionProfileEntity,
  NutritionDailyLogEntity,
  NutritionMealEntryEntity,
  NutritionFoodEntity,
  NutritionTemplateEntity,
  NutritionWaterOperationEntity,
];
