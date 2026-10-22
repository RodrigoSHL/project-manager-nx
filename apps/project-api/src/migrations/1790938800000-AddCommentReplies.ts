import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentReplies1790938800000 implements MigrationInterface {
  name = 'AddCommentReplies1790938800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ADD "parentCommentId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_parentCommentId" ON "comments" ("parentCommentId")`);
    await queryRunner.query(`
      ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_parentCommentId"
      FOREIGN KEY ("parentCommentId") REFERENCES "comments" ("id") ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_parentCommentId"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_parentCommentId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "parentCommentId"`);
  }
}
