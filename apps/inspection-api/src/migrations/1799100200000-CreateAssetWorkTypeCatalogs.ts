import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetWorkTypeCatalogs1799100200000
  implements MigrationInterface
{
  name = 'CreateAssetWorkTypeCatalogs1799100200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "asset_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(80) NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_asset_types_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_asset_types_tenant_code"
          UNIQUE ("tenant_id", "code"),
        CONSTRAINT "UQ_asset_types_id_tenant"
          UNIQUE ("id", "tenant_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "work_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(80) NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_work_types_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_work_types_tenant_code"
          UNIQUE ("tenant_id", "code"),
        CONSTRAINT "UQ_work_types_id_tenant"
          UNIQUE ("id", "tenant_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "assets"
      DROP CONSTRAINT "CK_assets_root_substation"
    `);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD COLUMN "asset_type_id" uuid
    `);
    await queryRunner.query(`
      INSERT INTO "asset_types" (
        "id", "tenant_id", "code", "name", "description", "active"
      )
      SELECT DISTINCT
        uuid_generate_v5(
          uuid_ns_url(),
          'https://gridassets.local/asset-type/' || "tenant_id"::text || '/' || "type"
        ),
        "tenant_id",
        "type",
        initcap(replace(lower("type"), '_', ' ')),
        NULL,
        true
      FROM "assets"
      ON CONFLICT ("tenant_id", "code") DO NOTHING
    `);
    await queryRunner.query(`
      UPDATE "assets" AS asset
      SET "asset_type_id" = asset_type."id"
      FROM "asset_types" AS asset_type
      WHERE asset_type."tenant_id" = asset."tenant_id"
        AND asset_type."code" = asset."type"
    `);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ALTER COLUMN "asset_type_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD CONSTRAINT "UQ_assets_id_tenant" UNIQUE ("id", "tenant_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD CONSTRAINT "FK_assets_asset_type_context"
      FOREIGN KEY ("asset_type_id", "tenant_id")
      REFERENCES "asset_types"("id", "tenant_id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "type"`);

    await queryRunner.query(`
      CREATE TABLE "asset_type_work_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "asset_type_id" uuid NOT NULL,
        "work_type_id" uuid NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_asset_type_work_types_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_asset_type_work_types_asset_type_context"
          FOREIGN KEY ("asset_type_id", "tenant_id")
          REFERENCES "asset_types"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_type_work_types_work_type_context"
          FOREIGN KEY ("work_type_id", "tenant_id")
          REFERENCES "work_types"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_asset_type_work_types_tenant_pair"
          UNIQUE ("tenant_id", "asset_type_id", "work_type_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_work_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "work_type_id" uuid NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_asset_work_types_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_asset_work_types_asset_context"
          FOREIGN KEY ("asset_id", "tenant_id")
          REFERENCES "assets"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_work_types_work_type_context"
          FOREIGN KEY ("work_type_id", "tenant_id")
          REFERENCES "work_types"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_asset_work_types_tenant_pair"
          UNIQUE ("tenant_id", "asset_id", "work_type_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_asset_types_tenant" ON "asset_types" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_types_tenant" ON "work_types" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_type_work_types_context" ON "asset_type_work_types" ("tenant_id", "asset_type_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_work_types_context" ON "asset_work_types" ("tenant_id", "asset_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "asset_work_types"`);
    await queryRunner.query(`DROP TABLE "asset_type_work_types"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD COLUMN "type" varchar(80)`
    );
    await queryRunner.query(`
      UPDATE "assets" AS asset
      SET "type" = asset_type."code"
      FROM "asset_types" AS asset_type
      WHERE asset_type."id" = asset."asset_type_id"
        AND asset_type."tenant_id" = asset."tenant_id"
    `);
    await queryRunner.query(
      `ALTER TABLE "assets" ALTER COLUMN "type" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "assets" DROP CONSTRAINT "FK_assets_asset_type_context"`
    );
    await queryRunner.query(
      `ALTER TABLE "assets" DROP CONSTRAINT "UQ_assets_id_tenant"`
    );
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "asset_type_id"`);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD CONSTRAINT "CK_assets_root_substation"
      CHECK ("parent_id" IS NOT NULL OR "type" = 'SUBSTATION')
    `);
    await queryRunner.query(`DROP TABLE "work_types"`);
    await queryRunner.query(`DROP TABLE "asset_types"`);
  }
}
