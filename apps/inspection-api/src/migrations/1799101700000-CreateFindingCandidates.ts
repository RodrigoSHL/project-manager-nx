import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFindingCandidates1799101700000
  implements MigrationInterface
{
  name = 'CreateFindingCandidates1799101700000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "severity_levels" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL,
      "code" varchar(80) NOT NULL, "name" varchar(160) NOT NULL,
      "sort_order" integer NOT NULL, "active" boolean NOT NULL DEFAULT true,
      CONSTRAINT "FK_severity_levels_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "UQ_severity_levels_tenant_code" UNIQUE ("tenant_id", "code"),
      CONSTRAINT "UQ_severity_levels_id_tenant" UNIQUE ("id", "tenant_id")
    )`);
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "min_value" double precision, ADD "max_value" double precision, ADD "out_of_range_severity_id" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD CONSTRAINT "CK_concepts_finding_range" CHECK ("min_value" IS NULL OR "max_value" IS NULL OR "min_value" <= "max_value")`
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD CONSTRAINT "CK_concepts_analog_finding" CHECK ("type" = 'ANALOG' OR ("min_value" IS NULL AND "max_value" IS NULL AND "out_of_range_severity_id" IS NULL))`
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD CONSTRAINT "FK_concepts_finding_severity" FOREIGN KEY ("out_of_range_severity_id", "tenant_id") REFERENCES "severity_levels"("id", "tenant_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "concept_options" ADD "generates_finding" boolean NOT NULL DEFAULT false, ADD "suggested_severity_id" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "concept_options" ADD CONSTRAINT "CK_concept_options_finding_severity" CHECK ("generates_finding" OR "suggested_severity_id" IS NULL)`
    );
    await queryRunner.query(
      `ALTER TABLE "concept_options" ADD CONSTRAINT "FK_concept_options_finding_severity" FOREIGN KEY ("suggested_severity_id", "tenant_id") REFERENCES "severity_levels"("id", "tenant_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "work_item_annotations" ADD "is_finding" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_assets_id_tenant_findings" UNIQUE ("id", "tenant_id")`
    );
    await queryRunner.query(`CREATE TABLE "finding_candidates" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL,
      "work_id" uuid NOT NULL, "work_item_id" uuid NOT NULL, "asset_id" uuid NOT NULL,
      "concept_id" uuid, "source" varchar(16) NOT NULL, "title" varchar(240) NOT NULL,
      "description" text, "measured_value" text, "min_value" double precision,
      "max_value" double precision, "suggested_severity_id" uuid,
      "status" varchar(16) NOT NULL DEFAULT 'PENDING',
      "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "FK_finding_candidates_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_finding_candidates_work" FOREIGN KEY ("work_id", "tenant_id") REFERENCES "works"("id", "tenant_id") ON DELETE CASCADE,
      CONSTRAINT "FK_finding_candidates_asset" FOREIGN KEY ("asset_id", "tenant_id") REFERENCES "assets"("id", "tenant_id") ON DELETE RESTRICT,
      CONSTRAINT "FK_finding_candidates_concept" FOREIGN KEY ("concept_id", "tenant_id") REFERENCES "concepts"("id", "tenant_id") ON DELETE RESTRICT,
      CONSTRAINT "FK_finding_candidates_severity" FOREIGN KEY ("suggested_severity_id", "tenant_id") REFERENCES "severity_levels"("id", "tenant_id"),
      CONSTRAINT "UQ_finding_candidates_work_item_source" UNIQUE ("tenant_id", "work_id", "work_item_id", "source"),
      CONSTRAINT "CK_finding_candidates_source" CHECK ("source" IN ('DIGITAL','ANALOG','MANUAL')),
      CONSTRAINT "CK_finding_candidates_status" CHECK ("status" IN ('PENDING','CONFIRMED','DISCARDED'))
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_finding_candidates_tenant_work" ON "finding_candidates" ("tenant_id", "work_id")`
    );
    await queryRunner.query(
      `CREATE TRIGGER "TR_server_changes_severity_levels" AFTER INSERT OR UPDATE OR DELETE ON "severity_levels" FOR EACH ROW EXECUTE FUNCTION record_server_change('SEVERITY_LEVEL', 'global')`
    );
    await queryRunner.query(
      `CREATE TRIGGER "TR_server_changes_finding_candidates" AFTER INSERT OR UPDATE OR DELETE ON "finding_candidates" FOR EACH ROW EXECUTE FUNCTION record_server_change('FINDING_CANDIDATE', 'work')`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TR_server_changes_finding_candidates" ON "finding_candidates"`
    );
    await queryRunner.query(
      `DROP TRIGGER "TR_server_changes_severity_levels" ON "severity_levels"`
    );
    await queryRunner.query(`DROP TABLE "finding_candidates"`);
    await queryRunner.query(
      `ALTER TABLE "assets" DROP CONSTRAINT "UQ_assets_id_tenant_findings"`
    );
    await queryRunner.query(
      `ALTER TABLE "work_item_annotations" DROP COLUMN "is_finding"`
    );
    await queryRunner.query(
      `ALTER TABLE "concept_options" DROP CONSTRAINT "FK_concept_options_finding_severity", DROP CONSTRAINT "CK_concept_options_finding_severity", DROP COLUMN "suggested_severity_id", DROP COLUMN "generates_finding"`
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP CONSTRAINT "FK_concepts_finding_severity", DROP CONSTRAINT "CK_concepts_finding_range", DROP CONSTRAINT "CK_concepts_analog_finding", DROP COLUMN "out_of_range_severity_id", DROP COLUMN "max_value", DROP COLUMN "min_value"`
    );
    await queryRunner.query(`DROP TABLE "severity_levels"`);
  }
}
