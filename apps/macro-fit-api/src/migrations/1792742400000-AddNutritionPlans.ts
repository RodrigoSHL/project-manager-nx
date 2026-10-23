import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNutritionPlans1792742400000 implements MigrationInterface {
  name = 'AddNutritionPlans1792742400000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE nutrition_plans (
        user_id uuid NOT NULL, version integer NOT NULL CHECK (version > 0), starts_on date NOT NULL, data jsonb NOT NULL,
        PRIMARY KEY (user_id, version)
      );
      CREATE INDEX nutrition_plans_effective_idx ON nutrition_plans(user_id, starts_on, version);
      ALTER TABLE nutrition_daily_logs ADD COLUMN plan_version integer;
      ALTER TABLE nutrition_daily_logs ADD CONSTRAINT nutrition_daily_plan_fk
        FOREIGN KEY (user_id, plan_version) REFERENCES nutrition_plans(user_id, version);
    `);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE nutrition_daily_logs DROP COLUMN plan_version; DROP TABLE nutrition_plans'
    );
  }
}
