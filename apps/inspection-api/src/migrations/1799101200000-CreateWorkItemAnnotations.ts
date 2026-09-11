import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkItemAnnotations1799101200000
  implements MigrationInterface
{
  name = 'CreateWorkItemAnnotations1799101200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_item_annotations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "work_id" uuid NOT NULL,
        "form_item_id" uuid NOT NULL,
        "comment" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_work_item_annotations_work_context"
          FOREIGN KEY ("work_id", "tenant_id")
          REFERENCES "works"("id", "tenant_id") ON DELETE CASCADE,
        CONSTRAINT "UQ_work_item_annotations_tenant_work_item"
          UNIQUE ("tenant_id", "work_id", "form_item_id"),
        CONSTRAINT "CK_work_item_annotations_comment"
          CHECK (length(btrim("comment")) BETWEEN 1 AND 2000)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_work_item_annotations_work" ON "work_item_annotations" ("tenant_id", "work_id")`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "work_item_annotations"`);
  }
}
