import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrencyPreferences1785067200000
  implements MigrationInterface
{
  name = 'CreateCurrencyPreferences1785067200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "currency_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "baseCurrency" varchar(3) NOT NULL DEFAULT 'CLP',
        "targetCurrencies" jsonb NOT NULL DEFAULT '["EUR","USD","CHF","GBP"]'::jsonb,
        "feePercent" numeric(5,2) NOT NULL DEFAULT 0 CHECK ("feePercent" >= 0 AND "feePercent" <= 25),
        "quickAmounts" jsonb NOT NULL DEFAULT '[1000,10000,50000,100000]'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "currency_preferences"`);
  }
}
