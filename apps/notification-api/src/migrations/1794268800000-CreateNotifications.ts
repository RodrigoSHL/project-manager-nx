import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1794268800000 implements MigrationInterface {
  name = 'CreateNotifications1794268800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TABLE "notifications" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "application" varchar(100) NOT NULL,
      "projectId" varchar(255) NOT NULL,
      "recipientId" varchar(255) NOT NULL,
      "type" varchar(100) NOT NULL DEFAULT 'info',
      "title" varchar(200) NOT NULL,
      "body" text NOT NULL,
      "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "eventKey" varchar(200),
      "readAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_inbox" ON "notifications" ("application", "projectId", "recipientId", "createdAt", "id")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_notifications_event" ON "notifications" ("application", "projectId", "recipientId", "eventKey")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_unread" ON "notifications" ("application", "projectId", "recipientId") WHERE "readAt" IS NULL`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "notifications"');
  }
}
