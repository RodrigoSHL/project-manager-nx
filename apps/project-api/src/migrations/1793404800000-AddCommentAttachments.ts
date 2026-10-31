import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentAttachments1793404800000 implements MigrationInterface {
  name = 'AddCommentAttachments1793404800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ADD "attachmentIds" uuid[] NOT NULL DEFAULT '{}'::uuid[]`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "attachmentIds"`);
  }
}
