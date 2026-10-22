import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectTeamRoles1790812800000 implements MigrationInterface {
  name = 'AddProjectTeamRoles1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Compatible con bases donde estos valores ya se agregaron manualmente.
    await queryRunner.query(
      `ALTER TYPE "public"."team_members_role_enum" ADD VALUE IF NOT EXISTS 'member'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."team_members_role_enum" ADD VALUE IF NOT EXISTS 'analyst'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."team_members_role_enum" ADD VALUE IF NOT EXISTS 'technician'`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."team_members_role_enum_previous" AS ENUM (
        'tech_lead', 'developer', 'devops', 'product_owner',
        'scrum_master', 'qa', 'designer', 'architect'
      )
    `);
    // PostgreSQL rechaza la conversión si alguno de los roles nuevos está en uso.
    await queryRunner.query(`
      ALTER TABLE "public"."team_members"
      ALTER COLUMN "role" TYPE "public"."team_members_role_enum_previous"
      USING "role"::text::"public"."team_members_role_enum_previous"
    `);
    await queryRunner.query(`DROP TYPE "public"."team_members_role_enum"`);
    await queryRunner.query(`
      ALTER TYPE "public"."team_members_role_enum_previous"
      RENAME TO "team_members_role_enum"
    `);
  }
}
