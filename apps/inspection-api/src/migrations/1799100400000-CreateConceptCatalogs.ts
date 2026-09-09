import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConceptCatalogs1799100400000 implements MigrationInterface {
  name = 'CreateConceptCatalogs1799100400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "concept_type_enum" AS ENUM (
        'ANALOG', 'DIGITAL', 'TEXT', 'HIDDEN'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "concepts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(80) NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text,
        "type" "concept_type_enum" NOT NULL,
        "unit" varchar(30),
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_concepts_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_concepts_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "UQ_concepts_id_tenant" UNIQUE ("id", "tenant_id"),
        CONSTRAINT "CK_concepts_unit_by_type"
          CHECK ("type" = 'ANALOG' OR "unit" IS NULL)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "concept_options" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "concept_id" uuid NOT NULL,
        "value" varchar(80) NOT NULL,
        "label" varchar(160) NOT NULL,
        "sort_order" integer NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_concept_options_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_concept_options_concept_context"
          FOREIGN KEY ("concept_id", "tenant_id")
          REFERENCES "concepts"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_concept_options_tenant_concept_value"
          UNIQUE ("tenant_id", "concept_id", "value"),
        CONSTRAINT "CK_concept_options_order" CHECK ("sort_order" >= 1)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_type_concepts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "asset_type_id" uuid NOT NULL,
        "concept_id" uuid NOT NULL,
        "sort_order" integer,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_asset_type_concepts_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_type_concepts_asset_type_context"
          FOREIGN KEY ("asset_type_id", "tenant_id")
          REFERENCES "asset_types"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_type_concepts_concept_context"
          FOREIGN KEY ("concept_id", "tenant_id")
          REFERENCES "concepts"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_asset_type_concepts_tenant_pair"
          UNIQUE ("tenant_id", "asset_type_id", "concept_id"),
        CONSTRAINT "CK_asset_type_concepts_order"
          CHECK ("sort_order" IS NULL OR "sort_order" >= 1)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_concepts_tenant" ON "concepts" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_concept_options_context" ON "concept_options" ("tenant_id", "concept_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_type_concepts_context" ON "asset_type_concepts" ("tenant_id", "asset_type_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "asset_type_concepts"`);
    await queryRunner.query(`DROP TABLE "concept_options"`);
    await queryRunner.query(`DROP TABLE "concepts"`);
    await queryRunner.query(`DROP TYPE "concept_type_enum"`);
  }
}
