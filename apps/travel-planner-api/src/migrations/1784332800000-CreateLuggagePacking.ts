import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLuggagePacking1784332800000 implements MigrationInterface {
  name = 'CreateLuggagePacking1784332800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "luggage" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ownerId" varchar NOT NULL,
        "name" varchar(120) NOT NULL,
        "type" varchar(40) NOT NULL,
        "image" text,
        "color" varchar(20) NOT NULL DEFAULT '#0ea5e9',
        "brand" varchar(80),
        "model" varchar(80),
        "capacityLiters" double precision,
        "emptyWeight" double precision NOT NULL DEFAULT 0,
        "maxWeight" double precision,
        "dimensions" jsonb,
        "cabinCompatible" boolean NOT NULL DEFAULT false,
        "personalItemCompatible" boolean NOT NULL DEFAULT false,
        "checkedBaggage" boolean NOT NULL DEFAULT false,
        "notes" text,
        "archived" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_luggage_owner_id" ON "luggage" ("ownerId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trip_luggage" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tripId" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
        "luggageId" uuid NOT NULL REFERENCES "luggage"("id") ON DELETE CASCADE,
        "ownerId" varchar NOT NULL,
        "actualWeight" double precision,
        "occupancyLevel" varchar(24) NOT NULL DEFAULT 'empty',
        "maxWeightOverride" double precision,
        "status" varchar(20) NOT NULL DEFAULT 'planned',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_trip_luggage_trip_luggage" UNIQUE ("tripId", "luggageId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trip_luggage_trip_id" ON "trip_luggage" ("tripId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "packing_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tripId" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
        "userId" varchar NOT NULL,
        "luggageId" uuid REFERENCES "trip_luggage"("id") ON DELETE SET NULL,
        "catalogItemId" varchar(80),
        "name" varchar(140) NOT NULL,
        "category" varchar(32) NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "haveIt" boolean NOT NULL DEFAULT false,
        "packed" boolean NOT NULL DEFAULT false,
        "purchaseRequired" boolean NOT NULL DEFAULT false,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "priority" varchar(20) NOT NULL DEFAULT 'normal',
        "estimatedWeight" double precision NOT NULL DEFAULT 0,
        "actualWeight" double precision,
        "packMoment" varchar(24) NOT NULL DEFAULT 'advance',
        "shared" boolean NOT NULL DEFAULT false,
        "private" boolean NOT NULL DEFAULT false,
        "responsibleUserId" varchar,
        "notes" text,
        "source" varchar(32) NOT NULL DEFAULT 'manual',
        "ruleId" varchar(80),
        "explanation" text,
        "cabinPolicy" varchar(24) NOT NULL DEFAULT 'check_airline',
        "checkedPolicy" varchar(24) NOT NULL DEFAULT 'allowed',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_packing_items_trip_user" ON "packing_items" ("tripId", "userId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "packing_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "trip_luggage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "luggage"`);
  }
}
