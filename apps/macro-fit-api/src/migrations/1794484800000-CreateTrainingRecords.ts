import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingRecords1794484800000 implements MigrationInterface {
  async up(runner: QueryRunner) {
    await runner.query(`
      CREATE TABLE training_drafts (
        user_id uuid PRIMARY KEY,
        revision integer NOT NULL DEFAULT 0,
        draft jsonb
      )
    `);
    await runner.query(`
      CREATE TABLE training_sessions (
        user_id uuid NOT NULL,
        id uuid NOT NULL,
        finished_at timestamptz NOT NULL,
        data jsonb NOT NULL,
        PRIMARY KEY (user_id, id)
      )
    `);
    await runner.query(`
      CREATE INDEX training_sessions_history_idx
      ON training_sessions (user_id, finished_at DESC, id DESC)
    `);
    await runner.query(`
      CREATE TABLE training_custom_exercises (
        user_id uuid NOT NULL,
        id uuid NOT NULL,
        data jsonb NOT NULL,
        PRIMARY KEY (user_id, id)
      )
    `);
  }

  async down(runner: QueryRunner) {
    await runner.query('DROP TABLE training_custom_exercises');
    await runner.query('DROP TABLE training_sessions');
    await runner.query('DROP TABLE training_drafts');
  }
}
