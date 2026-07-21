import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTripMembers1784332700000 implements MigrationInterface {
  name = 'CreateTripMembers1784332700000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "trip_members_role_enum" AS ENUM ('viewer', 'editor');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trip_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tripId" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL,
        "role" "trip_members_role_enum" NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_trip_members_trip_user" UNIQUE ("tripId", "userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trip_members_user_id" ON "trip_members" ("userId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "trip_members"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "trip_members_role_enum"`);
  }
}
