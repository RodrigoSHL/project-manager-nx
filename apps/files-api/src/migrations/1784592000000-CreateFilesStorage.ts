import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesStorage1784592000000 implements MigrationInterface {
  name = 'CreateFilesStorage1784592000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "file_blobs" (
        "storageKey" varchar(255) PRIMARY KEY,
        "data" bytea NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stored_files" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application" varchar(100) NOT NULL,
        "ownerType" varchar(100),
        "ownerId" varchar(255),
        "originalName" varchar(255) NOT NULL,
        "mimeType" varchar(150) NOT NULL,
        "size" bigint NOT NULL,
        "checksumSha256" char(64) NOT NULL,
        "storageProvider" varchar(50) NOT NULL,
        "storageKey" varchar(255) NOT NULL UNIQUE,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stored_files_application"
      ON "stored_files" ("application")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stored_files_owner"
      ON "stored_files" ("application", "ownerType", "ownerId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stored_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_blobs"`);
  }
}
