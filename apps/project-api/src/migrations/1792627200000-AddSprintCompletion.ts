import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSprintCompletion1792627200000 implements MigrationInterface {
  name = 'AddSprintCompletion1792627200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sprints"
      ADD COLUMN IF NOT EXISTS "completedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "completionSummary" jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sprints"
      DROP COLUMN "completionSummary", DROP COLUMN "completedAt"`);
  }
}
