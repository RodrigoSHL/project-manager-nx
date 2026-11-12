import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSprintWeeklyCapacity1794362400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "weeklyCapacityPoints" integer');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "sprints" DROP COLUMN "weeklyCapacityPoints"');
  }
}
