import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantMemberships1799101100000
  implements MigrationInterface
{
  name = 'CreateTenantMemberships1799101100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_memberships" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tenant_memberships_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_tenant_memberships_tenant_user"
          UNIQUE ("tenant_id", "user_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_memberships_user" ON "tenant_memberships" ("user_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_memberships"`);
  }
}
