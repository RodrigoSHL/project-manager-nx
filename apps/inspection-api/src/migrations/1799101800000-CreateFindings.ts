import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFindings1799101800000 implements MigrationInterface {
  name = 'CreateFindings1799101800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "finding_candidates" ADD "discard_reason" text`
    );
    await queryRunner.query(
      `ALTER TABLE "finding_candidates" ADD CONSTRAINT "UQ_finding_candidates_id_tenant_work" UNIQUE ("id", "tenant_id", "work_id")`
    );
    await queryRunner.query(`CREATE TABLE "findings" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "tenant_id" uuid NOT NULL, "work_id" uuid NOT NULL, "work_item_id" uuid NOT NULL,
      "asset_id" uuid NOT NULL, "concept_id" uuid, "source_candidate_id" uuid NOT NULL,
      "source" varchar(16) NOT NULL, "title" varchar(240) NOT NULL,
      "description" text, "measured_value" text, "min_value" double precision,
      "max_value" double precision, "severity_id" uuid, "man_hours" double precision,
      "materials" text, "asset_name_snapshot" varchar(240) NOT NULL,
      "concept_name_snapshot" varchar(240), "unit_snapshot" varchar(80),
      "sort_order" integer NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_findings_source_candidate" UNIQUE ("source_candidate_id"),
      CONSTRAINT "FK_findings_work" FOREIGN KEY ("work_id", "tenant_id") REFERENCES "works"("id", "tenant_id") ON DELETE CASCADE,
      CONSTRAINT "FK_findings_candidate" FOREIGN KEY ("source_candidate_id", "tenant_id", "work_id") REFERENCES "finding_candidates"("id", "tenant_id", "work_id") ON DELETE RESTRICT,
      CONSTRAINT "FK_findings_asset" FOREIGN KEY ("asset_id", "tenant_id") REFERENCES "assets"("id", "tenant_id") ON DELETE RESTRICT,
      CONSTRAINT "FK_findings_concept" FOREIGN KEY ("concept_id", "tenant_id") REFERENCES "concepts"("id", "tenant_id") ON DELETE RESTRICT,
      CONSTRAINT "FK_findings_severity" FOREIGN KEY ("severity_id", "tenant_id") REFERENCES "severity_levels"("id", "tenant_id") ON DELETE RESTRICT,
      CONSTRAINT "CK_findings_source" CHECK ("source" IN ('DIGITAL','ANALOG','MANUAL')),
      CONSTRAINT "CK_findings_man_hours" CHECK ("man_hours" IS NULL OR ("man_hours" >= 0 AND "man_hours" < 'Infinity'::float8))
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_findings_tenant_work_order" ON "findings" ("tenant_id", "work_id", "sort_order", "id")`
    );
    await queryRunner.query(
      `CREATE TRIGGER "TR_server_changes_findings" AFTER INSERT OR UPDATE OR DELETE ON "findings" FOR EACH ROW EXECUTE FUNCTION record_server_change('FINDING', 'work')`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TR_server_changes_findings" ON "findings"`
    );
    await queryRunner.query(`DROP TABLE "findings"`);
    await queryRunner.query(
      `ALTER TABLE "finding_candidates" DROP CONSTRAINT "UQ_finding_candidates_id_tenant_work"`
    );
    await queryRunner.query(
      `ALTER TABLE "finding_candidates" DROP COLUMN "discard_reason"`
    );
  }
}
