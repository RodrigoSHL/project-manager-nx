import { MigrationInterface, QueryRunner } from 'typeorm';
import { REQUIRED_SUBSTATION_ASSET_TYPE } from '../app/catalog/required-tenant-catalog';

export class ProvisionRequiredTenantCatalog1799101400000
  implements MigrationInterface
{
  name = 'ProvisionRequiredTenantCatalog1799101400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO "asset_types" (
          "id", "tenant_id", "code", "name", "description", "active"
        )
        SELECT
          uuid_generate_v5(
            uuid_ns_url(),
            'https://gridassets.local/asset-type/' || "id"::text || '/SUBSTATION'
          ),
          "id", $1, $2, $3, true
        FROM "tenants"
        ON CONFLICT ("tenant_id", "code") DO UPDATE SET
          "active" = true
      `,
      [
        REQUIRED_SUBSTATION_ASSET_TYPE.code,
        REQUIRED_SUBSTATION_ASSET_TYPE.name,
        REQUIRED_SUBSTATION_ASSET_TYPE.description,
      ]
    );
  }

  async down(): Promise<void> {
    // The structural type may already be referenced by root assets. Removing it
    // during rollback would break tenant trees, so this data repair is retained.
  }
}
