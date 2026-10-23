import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDayProductEquivalences1792785600000
  implements MigrationInterface
{
  name = 'AddDayProductEquivalences1792785600000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      "ALTER TABLE nutrition_daily_logs ADD COLUMN product_rules jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(product_rules) = 'array')"
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE nutrition_daily_logs DROP COLUMN product_rules'
    );
  }
}
