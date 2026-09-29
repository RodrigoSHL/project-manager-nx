import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexAnalyticsFindings1799102100000 implements MigrationInterface {
  name = 'IndexAnalyticsFindings1799102100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX "IDX_findings_analytics_severity" ON "findings" ("tenant_id", "severity_id", "work_id")'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_findings_analytics_asset" ON "findings" ("tenant_id", "asset_id", "work_id")'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_findings_analytics_asset"');
    await queryRunner.query('DROP INDEX "IDX_findings_analytics_severity"');
  }
}
