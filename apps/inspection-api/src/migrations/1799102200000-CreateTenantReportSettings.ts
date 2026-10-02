import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantReportSettings1799102200000
  implements MigrationInterface
{
  name = 'CreateTenantReportSettings1799102200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "tenant_report_settings" (
      "tenant_id" uuid PRIMARY KEY,
      "defaults" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "logo_data_uri" text,
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "FK_tenant_report_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tenant_report_settings"');
  }
}
