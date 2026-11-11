import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexNotificationRecipientHistory1794355200000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient_history"
      ON "notifications" ("application", "recipientId", "createdAt", "id")`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX "IDX_notifications_recipient_history"');
  }
}
