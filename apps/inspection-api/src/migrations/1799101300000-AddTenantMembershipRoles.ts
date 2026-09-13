import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantMembershipRoles1799101300000
  implements MigrationInterface
{
  name = 'AddTenantMembershipRoles1799101300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tenant_role_enum" AS ENUM (
        'TENANT_ADMIN',
        'SUPERVISOR',
        'INSPECTOR',
        'VIEWER'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD COLUMN "role" "tenant_role_enum" NOT NULL DEFAULT 'INSPECTOR'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" DROP COLUMN "role"`
    );
    await queryRunner.query(`DROP TYPE "tenant_role_enum"`);
  }
}
