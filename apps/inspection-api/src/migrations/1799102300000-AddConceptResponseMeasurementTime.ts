import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConceptResponseMeasurementTime1799102300000
  implements MigrationInterface
{
  name = 'AddConceptResponseMeasurementTime1799102300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "concept_responses" ADD "measured_at_time" time'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "concept_responses" DROP COLUMN "measured_at_time"'
    );
  }
}
