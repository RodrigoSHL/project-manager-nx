import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendTenantsForPlatformAdministration1799101000000
  implements MigrationInterface
{
  name = 'ExtendTenantsForPlatformAdministration1799101000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD "code" varchar(50)`);
    await queryRunner.query(`
      UPDATE "tenants"
      SET "code" = CASE "name"
        WHEN 'Empresa Minera Andina' THEN 'MINERA_ANDINA'
        WHEN 'Energía del Pacífico' THEN 'ENERGIA_PACIFICO'
        ELSE 'TENANT_' || upper(left(replace("id"::text, '-', ''), 8))
      END
    `);
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "code" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "UQ_tenants_code" UNIQUE ("code")`
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "active" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "created_at" timestamptz NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "updated_at" timestamptz NOT NULL DEFAULT now()`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "active"`);
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "UQ_tenants_code"`
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "code"`);
  }
}
