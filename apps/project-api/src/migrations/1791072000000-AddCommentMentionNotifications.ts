import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentMentionNotifications1791072000000
  implements MigrationInterface
{
  name = 'AddCommentMentionNotifications1791072000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    // Development synchronization may already have created this table.
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "comment_mention_notifications" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL,
      "memberId" uuid NOT NULL, "recipientUserId" uuid NOT NULL, "payload" jsonb NOT NULL,
      "deliveryPayload" jsonb, "status" varchar(20) NOT NULL DEFAULT 'pending',
      "attempts" integer NOT NULL DEFAULT 0, "nextAttemptAt" timestamptz NOT NULL DEFAULT now(),
      "lockedUntil" timestamptz, "lastCode" varchar(100), "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_comment_mention_notifications" PRIMARY KEY ("id"),
      CONSTRAINT "FK_comment_mention_comment" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_comment_mention_recipient" ON "comment_mention_notifications" ("commentId", "recipientUserId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comment_mention_pending" ON "comment_mention_notifications" ("status", "nextAttemptAt")`
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comment_mention_notifications"`);
  }
}
