import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixActiveActivityExpenseLink1785067300000
  implements MigrationInterface
{
  name = 'FixActiveActivityExpenseLink1785067300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_activityId_key"`
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "UQ_expenses_activityId"`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_expenses_active_activity" ON "expenses" ("activityId") WHERE "deletedAt" IS NULL AND "activityId" IS NOT NULL`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_expenses_active_activity"`
    );
    await queryRunner.query(
      `UPDATE "expenses" SET "activityId" = NULL WHERE "deletedAt" IS NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "expenses_activityId_key" UNIQUE ("activityId")`
    );
  }
}
