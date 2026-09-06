import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInspectionCatalog1799100000000
  implements MigrationInterface
{
  name = 'CreateInspectionCatalog1799100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "site_type_enum" AS ENUM ('MINE', 'PLANT', 'SITE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "asset_status_enum" AS ENUM ('ACTIVE', 'OUT_OF_SERVICE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(160) NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(40) NOT NULL,
        "name" varchar(160) NOT NULL,
        "type" "site_type_enum" NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_sites_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sites_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "UQ_sites_id_tenant" UNIQUE ("id", "tenant_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "code" varchar(60) NOT NULL,
        "name" varchar(180) NOT NULL,
        "type" varchar(80) NOT NULL,
        "parent_id" uuid,
        "status" "asset_status_enum" NOT NULL,
        "description" text,
        CONSTRAINT "FK_assets_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assets_site_context" FOREIGN KEY ("site_id", "tenant_id")
          REFERENCES "sites"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_assets_tenant_site_code"
          UNIQUE ("tenant_id", "site_id", "code"),
        CONSTRAINT "UQ_assets_id_tenant_site"
          UNIQUE ("id", "tenant_id", "site_id"),
        CONSTRAINT "FK_assets_parent_context"
          FOREIGN KEY ("parent_id", "tenant_id", "site_id")
          REFERENCES "assets"("id", "tenant_id", "site_id") ON DELETE RESTRICT,
        CONSTRAINT "CK_assets_root_substation"
          CHECK ("parent_id" IS NOT NULL OR "type" = 'SUBSTATION')
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sites_tenant" ON "sites" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assets_context" ON "assets" ("tenant_id", "site_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assets_parent" ON "assets" ("parent_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "asset_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "site_type_enum"`);
  }
}
