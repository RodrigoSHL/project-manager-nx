import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingRoutines1794492000000 implements MigrationInterface {
  async up(runner: QueryRunner) {
    await runner.query(`
      CREATE TABLE training_routines (
        user_id uuid NOT NULL,
        id uuid NOT NULL,
        data jsonb NOT NULL,
        PRIMARY KEY (user_id, id)
      )
    `);
  }

  async down(runner: QueryRunner) {
    await runner.query('DROP TABLE training_routines');
  }
}
