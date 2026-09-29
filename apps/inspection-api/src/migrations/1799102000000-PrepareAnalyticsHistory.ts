import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrepareAnalyticsHistory1799102000000
  implements MigrationInterface
{
  name = 'PrepareAnalyticsHistory1799102000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "concept_responses" ADD "measured_at" date`
    );
    // Existing responses were recorded without a measurement clock. The work's
    // execution day is the only historical date available; never use created_at.
    await queryRunner.query(`
      UPDATE "concept_responses" AS response
      SET "measured_at" = work."execution_date"
      FROM "works" AS work
      WHERE response."work_id" = work."id"
        AND response."tenant_id" = work."tenant_id"
    `);
    await queryRunner.query(
      `ALTER TABLE "concept_responses" ALTER COLUMN "measured_at" SET NOT NULL`
    );
    await queryRunner.query(`
      CREATE INDEX "IDX_works_analytics_scope"
      ON "works" ("tenant_id", "status", "execution_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_concept_responses_analytics_date"
      ON "concept_responses" ("tenant_id", "measured_at", "work_id")
      WHERE "value_number" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_concept_responses_analytics_concept"
      ON "concept_responses" ("tenant_id", "concept_id", "work_id")
      WHERE "value_number" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_concept_responses_analytics_concept"`
    );
    await queryRunner.query(
      `DROP INDEX "IDX_concept_responses_analytics_date"`
    );
    await queryRunner.query(`DROP INDEX "IDX_works_analytics_scope"`);
    await queryRunner.query(
      `ALTER TABLE "concept_responses" DROP COLUMN "measured_at"`
    );
  }
}
