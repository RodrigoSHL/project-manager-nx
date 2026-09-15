import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSyncOperations1799101500000
  implements MigrationInterface
{
  name = 'CreateSyncOperations1799101500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sync_operations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "device_id" uuid NOT NULL,
        "outbox_id" uuid NOT NULL,
        "entity_type" varchar(32) NOT NULL,
        "entity_id" uuid NOT NULL,
        "operation" varchar(10) NOT NULL,
        "status" varchar(16) NOT NULL,
        "attempts" integer NOT NULL DEFAULT 1,
        "last_error" text,
        "client_timestamp" timestamptz NOT NULL,
        "received_at" timestamptz NOT NULL DEFAULT now(),
        "processed_at" timestamptz,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sync_operations_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_sync_operations_entity_type" CHECK (
          "entity_type" IN ('WORK', 'RESPONSE', 'TASK_COMPLETION', 'ANNOTATION')
        ),
        CONSTRAINT "CK_sync_operations_operation" CHECK (
          "operation" IN ('CREATE', 'UPDATE', 'DELETE')
        ),
        CONSTRAINT "CK_sync_operations_status" CHECK (
          "status" IN ('PROCESSED', 'ERROR')
        ),
        CONSTRAINT "CK_sync_operations_attempts" CHECK ("attempts" >= 1),
        CONSTRAINT "UQ_sync_operations_tenant_outbox"
          UNIQUE ("tenant_id", "outbox_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sync_operations_tenant_device"
      ON "sync_operations" ("tenant_id", "device_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sync_operations_tenant_entity"
      ON "sync_operations" ("tenant_id", "entity_type", "entity_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sync_operations"`);
  }
}
