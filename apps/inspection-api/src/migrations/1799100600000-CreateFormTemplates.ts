import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormTemplates1799100600000 implements MigrationInterface {
  name = 'CreateFormTemplates1799100600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "form_item_type_enum" AS ENUM ('CONCEPT', 'TASK')
    `);

    await queryRunner.query(`
      CREATE TABLE "form_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "work_type_id" uuid NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text,
        "version" integer NOT NULL DEFAULT 1,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "FK_form_templates_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_form_templates_work_type_context"
          FOREIGN KEY ("work_type_id", "tenant_id")
          REFERENCES "work_types"("id", "tenant_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_form_templates_tenant_work_type_version"
          UNIQUE ("tenant_id", "work_type_id", "version"),
        CONSTRAINT "UQ_form_templates_id_tenant" UNIQUE ("id", "tenant_id"),
        CONSTRAINT "CK_form_templates_version" CHECK ("version" >= 1)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_form_templates_active_work_type"
      ON "form_templates" ("tenant_id", "work_type_id")
      WHERE "active" = true
    `);

    await queryRunner.query(`
      CREATE TABLE "form_sections" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "form_template_id" uuid NOT NULL,
        "title" varchar(160) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL,
        CONSTRAINT "FK_form_sections_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_form_sections_template_context"
          FOREIGN KEY ("form_template_id", "tenant_id")
          REFERENCES "form_templates"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_form_sections_tenant_template_order"
          UNIQUE ("tenant_id", "form_template_id", "sort_order"),
        CONSTRAINT "UQ_form_sections_id_tenant" UNIQUE ("id", "tenant_id"),
        CONSTRAINT "CK_form_sections_order" CHECK ("sort_order" >= 1)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "form_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "section_id" uuid NOT NULL,
        "type" "form_item_type_enum" NOT NULL,
        "sort_order" integer NOT NULL,
        "title" varchar(160),
        "description" text,
        "concept_id" uuid,
        "required" boolean NOT NULL DEFAULT false,
        CONSTRAINT "FK_form_items_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_form_items_section_context"
          FOREIGN KEY ("section_id", "tenant_id")
          REFERENCES "form_sections"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "FK_form_items_concept_context"
          FOREIGN KEY ("concept_id", "tenant_id")
          REFERENCES "concepts"("id", "tenant_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_form_items_tenant_section_order"
          UNIQUE ("tenant_id", "section_id", "sort_order"),
        CONSTRAINT "CK_form_items_order" CHECK ("sort_order" >= 1),
        CONSTRAINT "CK_form_items_content" CHECK (
          ("type" = 'TASK' AND "title" IS NOT NULL AND "concept_id" IS NULL)
          OR
          ("type" = 'CONCEPT' AND "title" IS NULL AND "concept_id" IS NOT NULL)
        )
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_form_templates_tenant" ON "form_templates" ("tenant_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_form_sections_context" ON "form_sections" ("tenant_id", "form_template_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_form_items_context" ON "form_items" ("tenant_id", "section_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_form_items_concept" ON "form_items" ("tenant_id", "concept_id") WHERE "concept_id" IS NOT NULL`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "form_items"`);
    await queryRunner.query(`DROP TABLE "form_sections"`);
    await queryRunner.query(`DROP TABLE "form_templates"`);
    await queryRunner.query(`DROP TYPE "form_item_type_enum"`);
  }
}
