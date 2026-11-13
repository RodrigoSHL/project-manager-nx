import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DateTrainingSessions1794488400000 implements MigrationInterface {
  async up(runner: QueryRunner) {
    await runner.query(`
      ALTER TABLE training_sessions
        ADD COLUMN performed_on date,
        ADD COLUMN revision integer NOT NULL DEFAULT 0
    `);
    await runner.query(`
      UPDATE training_sessions
      SET performed_on = (finished_at AT TIME ZONE 'America/Santiago')::date
    `);
    await runner.query(`
      ALTER TABLE training_sessions
        ALTER COLUMN performed_on SET DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::date),
        ALTER COLUMN performed_on SET NOT NULL
    `);
    await runner.query(`
      CREATE INDEX training_sessions_performed_on_idx
      ON training_sessions (user_id, performed_on DESC, finished_at DESC, id DESC)
    `);
  }

  async down(runner: QueryRunner) {
    await runner.query('DROP INDEX training_sessions_performed_on_idx');
    await runner.query(
      'ALTER TABLE training_sessions DROP COLUMN performed_on, DROP COLUMN revision'
    );
  }
}
