import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGeneratedReports1799101900000 implements MigrationInterface {
  name = 'CreateGeneratedReports1799101900000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "generated_reports" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "tenant_id" uuid NOT NULL,
      "work_id" uuid NOT NULL,
      "version" integer NOT NULL,
      "status" varchar(8) NOT NULL,
      "report_snapshot" jsonb NOT NULL,
      "generated_at" timestamptz NOT NULL DEFAULT now(),
      "generated_by" varchar(160),
      CONSTRAINT "UQ_generated_reports_work_version" UNIQUE ("tenant_id", "work_id", "version"),
      CONSTRAINT "CK_generated_reports_status" CHECK ("status" IN ('DRAFT', 'FINAL')),
      CONSTRAINT "CK_generated_reports_version" CHECK ("version" > 0),
      CONSTRAINT "FK_generated_reports_work" FOREIGN KEY ("work_id", "tenant_id") REFERENCES "works" ("id", "tenant_id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      'CREATE INDEX "IDX_generated_reports_work_date" ON "generated_reports" ("tenant_id", "work_id", "generated_at" DESC)'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "generated_reports"');
  }
}
