import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorks1799100800000 implements MigrationInterface {
  name = 'CreateWorks1799100800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "work_status_enum" AS ENUM (
        'DRAFT', 'IN_PROGRESS', 'FINISHED', 'REVIEWED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "works" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "work_type_id" uuid NOT NULL,
        "form_template_id" uuid NOT NULL,
        "form_template_version" integer NOT NULL,
        "title" varchar(200) NOT NULL,
        "execution_date" date NOT NULL,
        "responsible" varchar(160) NOT NULL,
        "company" varchar(160),
        "status" "work_status_enum" NOT NULL DEFAULT 'DRAFT',
        "notes" text,
        "form_snapshot" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_works_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_works_site_context"
          FOREIGN KEY ("site_id", "tenant_id")
          REFERENCES "sites"("id", "tenant_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_works_asset_context"
          FOREIGN KEY ("asset_id", "tenant_id", "site_id")
          REFERENCES "assets"("id", "tenant_id", "site_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_works_work_type_context"
          FOREIGN KEY ("work_type_id", "tenant_id")
          REFERENCES "work_types"("id", "tenant_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_works_template_context"
          FOREIGN KEY ("form_template_id", "tenant_id")
          REFERENCES "form_templates"("id", "tenant_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_works_id_tenant" UNIQUE ("id", "tenant_id"),
        CONSTRAINT "CK_works_template_version" CHECK ("form_template_version" >= 1)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "concept_responses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "work_id" uuid NOT NULL,
        "form_item_id" uuid NOT NULL,
        "concept_id" uuid NOT NULL,
        "value_number" double precision,
        "value_text" text,
        "selected_option_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_concept_responses_work_context"
          FOREIGN KEY ("work_id", "tenant_id")
          REFERENCES "works"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_concept_responses_tenant_work_item"
          UNIQUE ("tenant_id", "work_id", "form_item_id"),
        CONSTRAINT "CK_concept_responses_single_value" CHECK (
          num_nonnulls("value_number", "value_text", "selected_option_id") = 1
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "task_completions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "work_id" uuid NOT NULL,
        "form_item_id" uuid NOT NULL,
        "completed" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_task_completions_work_context"
          FOREIGN KEY ("work_id", "tenant_id")
          REFERENCES "works"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_task_completions_tenant_work_item"
          UNIQUE ("tenant_id", "work_id", "form_item_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_works_tenant_site" ON "works" ("tenant_id", "site_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_works_tenant_asset" ON "works" ("tenant_id", "asset_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_works_tenant_status" ON "works" ("tenant_id", "status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_concept_responses_work" ON "concept_responses" ("tenant_id", "work_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_task_completions_work" ON "task_completions" ("tenant_id", "work_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "task_completions"`);
    await queryRunner.query(`DROP TABLE "concept_responses"`);
    await queryRunner.query(`DROP TABLE "works"`);
    await queryRunner.query(`DROP TYPE "work_status_enum"`);
  }
}
