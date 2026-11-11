import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentMentionInboxDelivery1794355200000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "comment_mention_notifications"
      DROP CONSTRAINT IF EXISTS "FK_comment_mention_comment",
      ADD COLUMN IF NOT EXISTS "appPublishedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "appNextAttemptAt" timestamptz`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comment_mention_app_pending"
      ON "comment_mention_notifications" ("createdAt")
      WHERE "status" = 'sent' AND "appPublishedAt" IS NULL`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX "IDX_comment_mention_app_pending"');
    await queryRunner.query(`ALTER TABLE "comment_mention_notifications"
      DROP COLUMN "appNextAttemptAt", DROP COLUMN "appPublishedAt"`);
    // Restore the old constraint for new records while retaining delivery history.
    await queryRunner.query(`ALTER TABLE "comment_mention_notifications"
      ADD CONSTRAINT "FK_comment_mention_comment" FOREIGN KEY ("commentId")
      REFERENCES "comments"("id") ON DELETE CASCADE NOT VALID`);
  }
}
