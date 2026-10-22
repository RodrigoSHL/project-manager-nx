import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectTicketCounter1791547200000 implements MigrationInterface {
  name = 'AddProjectTicketCounter1791547200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "lastTicketNumber" integer NOT NULL DEFAULT 0`);
    // Keep an existing high-water mark when development synchronization has
    // already created the column. Read numeric suffixes, never ticket counts.
    await queryRunner.query(`UPDATE "projects" p
      SET "lastTicketNumber" = GREATEST(p."lastTicketNumber", COALESCE((
        SELECT MAX(substring(t."key" from '-([0-9]+)$')::integer)
        FROM "tickets" t WHERE t."projectId" = p."id"
      ), 0))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "lastTicketNumber"`);
  }
}
