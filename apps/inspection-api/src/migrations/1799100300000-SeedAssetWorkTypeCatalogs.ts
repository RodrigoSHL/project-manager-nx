import { MigrationInterface, QueryRunner } from 'typeorm';

type CatalogDefinition = {
  code: string;
  name: string;
  description: string;
};

const assetTypes: CatalogDefinition[] = [
  ['SUBSTATION', 'Subestación', 'Nodo superior del árbol de activos.'],
  [
    'POWER_TRANSFORMER',
    'Transformador de poder',
    'Transformador principal de alta o media tensión.',
  ],
  ['CIRCUIT_BREAKER', 'Interruptor', 'Equipo de maniobra y protección.'],
  [
    'BATTERY_BANK',
    'Banco de baterías',
    'Sistema de respaldo en corriente continua.',
  ],
  ['CONTROL_ROOM', 'Sala de control', 'Recinto de control y protección.'],
  [
    'PROTECTION_RELAY',
    'Relé de protección',
    'Dispositivo para detección de fallas.',
  ],
  [
    'RADIATOR_BANK',
    'Banco de radiadores',
    'Conjunto de radiadores de enfriamiento.',
  ],
  ['BUSHINGS', 'Bushings', 'Aisladores pasantes del transformador.'],
  [
    'PROTECTION_PANEL',
    'Tablero de protecciones',
    'Gabinete de equipos de protección.',
  ],
  ['COMMUNICATIONS', 'Comunicaciones', 'Equipos de telecomunicaciones.'],
  [
    'TAP_CHANGER',
    'Cambiador de tomas',
    'Regulador de tensión del transformador.',
  ],
  ['OIL_SYSTEM', 'Sistema de aceite', 'Circuito de aceite aislante.'],
  ['DRIVE_MECHANISM', 'Mecanismo de accionamiento', 'Mecanismo de operación.'],
  [
    'CURRENT_TRANSFORMER',
    'Transformador de corriente',
    'Transformador de medida.',
  ],
  [
    'COOLING_SYSTEM',
    'Sistema de enfriamiento',
    'Sistema de disipación térmica.',
  ],
  [
    'FAN_GROUP',
    'Grupo de ventiladores',
    'Ventiladores de enfriamiento forzado.',
  ],
  [
    'AUXILIARY_TRANSFORMER',
    'Transformador de servicios auxiliares',
    'Transformador para consumos auxiliares.',
  ],
  [
    'DISTRIBUTION_TRANSFORMER',
    'Transformador de distribución',
    'Transformador para redes de distribución.',
  ],
  [
    'LOW_VOLTAGE_PANEL',
    'Tablero de baja tensión',
    'Tablero de distribución BT.',
  ],
  [
    'MEDIUM_VOLTAGE_CELL',
    'Celda de media tensión',
    'Celda modular de maniobra MT.',
  ],
  ['UPS', 'UPS', 'Sistema de alimentación ininterrumpida.'],
  ['FEEDER', 'Alimentador', 'Circuito de salida hacia una carga.'],
].map(([code, name, description]) => ({ code, name, description }));

const workTypes: CatalogDefinition[] = [
  [
    'VISUAL_INSPECTION',
    'Inspección visual',
    'Revisión del estado visible del equipo.',
  ],
  [
    'PREVENTIVE_MAINTENANCE',
    'Mantenimiento preventivo',
    'Tareas planificadas de conservación.',
  ],
  ['THERMOGRAPHY', 'Termografía', 'Inspección mediante imágenes térmicas.'],
  [
    'ELECTRICAL_TESTS',
    'Pruebas eléctricas',
    'Mediciones y ensayos eléctricos.',
  ],
  [
    'PROTECTION_INSPECTION',
    'Inspección de protecciones',
    'Revisión funcional de sistemas de protección.',
  ],
  [
    'SPECIAL_ELECTRICAL_TEST',
    'Prueba eléctrica especial',
    'Prueba excepcional habilitada para equipos concretos.',
  ],
].map(([code, name, description]) => ({ code, name, description }));

const workTypeRules: Record<string, string[]> = {
  SUBSTATION: ['VISUAL_INSPECTION', 'THERMOGRAPHY'],
  POWER_TRANSFORMER: [
    'VISUAL_INSPECTION',
    'PREVENTIVE_MAINTENANCE',
    'THERMOGRAPHY',
  ],
  CIRCUIT_BREAKER: [
    'VISUAL_INSPECTION',
    'PREVENTIVE_MAINTENANCE',
    'ELECTRICAL_TESTS',
  ],
  BATTERY_BANK: [
    'VISUAL_INSPECTION',
    'PREVENTIVE_MAINTENANCE',
    'ELECTRICAL_TESTS',
  ],
  CONTROL_ROOM: ['VISUAL_INSPECTION', 'THERMOGRAPHY'],
  PROTECTION_RELAY: [
    'VISUAL_INSPECTION',
    'ELECTRICAL_TESTS',
    'PROTECTION_INSPECTION',
  ],
  PROTECTION_PANEL: ['VISUAL_INSPECTION', 'PROTECTION_INSPECTION'],
  RADIATOR_BANK: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  BUSHINGS: ['VISUAL_INSPECTION', 'THERMOGRAPHY', 'ELECTRICAL_TESTS'],
  TAP_CHANGER: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  OIL_SYSTEM: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  DRIVE_MECHANISM: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  CURRENT_TRANSFORMER: [
    'VISUAL_INSPECTION',
    'THERMOGRAPHY',
    'ELECTRICAL_TESTS',
  ],
  COOLING_SYSTEM: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  FAN_GROUP: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  AUXILIARY_TRANSFORMER: [
    'VISUAL_INSPECTION',
    'PREVENTIVE_MAINTENANCE',
    'THERMOGRAPHY',
  ],
  DISTRIBUTION_TRANSFORMER: [
    'VISUAL_INSPECTION',
    'PREVENTIVE_MAINTENANCE',
    'THERMOGRAPHY',
  ],
  LOW_VOLTAGE_PANEL: ['VISUAL_INSPECTION', 'THERMOGRAPHY'],
  MEDIUM_VOLTAGE_CELL: [
    'VISUAL_INSPECTION',
    'THERMOGRAPHY',
    'ELECTRICAL_TESTS',
  ],
  UPS: ['VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE'],
  FEEDER: ['VISUAL_INSPECTION', 'THERMOGRAPHY'],
  COMMUNICATIONS: ['VISUAL_INSPECTION'],
};

const assetOverrides = [
  {
    assetKey: 'a-norte-t1',
    workTypeCode: 'SPECIAL_ELECTRICAL_TEST',
    enabled: true,
  },
  {
    assetKey: 'a-sur-t2',
    workTypeCode: 'THERMOGRAPHY',
    enabled: false,
  },
];

export class SeedAssetWorkTypeCatalogs1799100300000
  implements MigrationInterface
{
  name = 'SeedAssetWorkTypeCatalogs1799100300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const assetType of assetTypes) {
      await queryRunner.query(
        `
          INSERT INTO "asset_types" (
            "id", "tenant_id", "code", "name", "description", "active"
          )
          SELECT
            uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/asset-type/' || "id"::text || '/' || $1
            ),
            "id", $1, $2, $3, true
          FROM "tenants"
          ON CONFLICT ("tenant_id", "code") DO UPDATE SET
            "name" = EXCLUDED."name",
            "description" = EXCLUDED."description",
            "active" = true
        `,
        [assetType.code, assetType.name, assetType.description]
      );
    }

    for (const workType of workTypes) {
      await queryRunner.query(
        `
          INSERT INTO "work_types" (
            "id", "tenant_id", "code", "name", "description", "active"
          )
          SELECT
            uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/work-type/' || "id"::text || '/' || $1
            ),
            "id", $1, $2, $3, true
          FROM "tenants"
          ON CONFLICT ("tenant_id", "code") DO UPDATE SET
            "name" = EXCLUDED."name",
            "description" = EXCLUDED."description",
            "active" = true
        `,
        [workType.code, workType.name, workType.description]
      );
    }

    for (const [assetTypeCode, workTypeCodes] of Object.entries(
      workTypeRules
    )) {
      for (const workTypeCode of workTypeCodes) {
        await queryRunner.query(
          `
            INSERT INTO "asset_type_work_types" (
              "id", "tenant_id", "asset_type_id", "work_type_id", "enabled"
            )
            SELECT
              uuid_generate_v5(
                uuid_ns_url(),
                'https://gridassets.local/asset-type-work-type/' ||
                  asset_type."tenant_id"::text || '/' || $1 || '/' || $2
              ),
              asset_type."tenant_id", asset_type."id", work_type."id", true
            FROM "asset_types" AS asset_type
            INNER JOIN "work_types" AS work_type
              ON work_type."tenant_id" = asset_type."tenant_id"
              AND work_type."code" = $2
            WHERE asset_type."code" = $1
            ON CONFLICT ("tenant_id", "asset_type_id", "work_type_id")
            DO UPDATE SET "enabled" = true
          `,
          [assetTypeCode, workTypeCode]
        );
      }
    }

    for (const override of assetOverrides) {
      await queryRunner.query(
        `
          INSERT INTO "asset_work_types" (
            "id", "tenant_id", "asset_id", "work_type_id", "enabled"
          )
          SELECT
            uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/asset-work-type/' ||
                asset."tenant_id"::text || '/' || asset."id"::text || '/' || $2
            ),
            asset."tenant_id", asset."id", work_type."id", $3
          FROM "assets" AS asset
          INNER JOIN "work_types" AS work_type
            ON work_type."tenant_id" = asset."tenant_id"
            AND work_type."code" = $2
          WHERE asset."id" = uuid_generate_v5(
            uuid_ns_url(),
            'https://gridassets.local/asset/' || $1
          )
          ON CONFLICT ("tenant_id", "asset_id", "work_type_id")
          DO UPDATE SET "enabled" = EXCLUDED."enabled"
        `,
        [override.assetKey, override.workTypeCode, override.enabled]
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const override of assetOverrides) {
      await queryRunner.query(
        `
          DELETE FROM "asset_work_types" AS relation
          USING "assets" AS asset, "work_types" AS work_type
          WHERE relation."asset_id" = asset."id"
            AND relation."tenant_id" = asset."tenant_id"
            AND relation."work_type_id" = work_type."id"
            AND work_type."tenant_id" = asset."tenant_id"
            AND asset."id" = uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/asset/' || $1
            )
            AND work_type."code" = $2
        `,
        [override.assetKey, override.workTypeCode]
      );
    }

    for (const [assetTypeCode, workTypeCodes] of Object.entries(
      workTypeRules
    )) {
      for (const workTypeCode of workTypeCodes) {
        await queryRunner.query(
          `
            DELETE FROM "asset_type_work_types" AS relation
            USING "asset_types" AS asset_type, "work_types" AS work_type
            WHERE relation."asset_type_id" = asset_type."id"
              AND relation."work_type_id" = work_type."id"
              AND relation."tenant_id" = asset_type."tenant_id"
              AND work_type."tenant_id" = asset_type."tenant_id"
              AND asset_type."code" = $1
              AND work_type."code" = $2
          `,
          [assetTypeCode, workTypeCode]
        );
      }
    }

    for (const workType of workTypes) {
      await queryRunner.query(
        `
          DELETE FROM "work_types"
          WHERE "code" = $1
            AND "id" = uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/work-type/' || "tenant_id"::text || '/' || $1
            )
        `,
        [workType.code]
      );
    }

    for (const assetType of assetTypes) {
      await queryRunner.query(
        `
          DELETE FROM "asset_types" AS asset_type
          WHERE asset_type."code" = $1
            AND asset_type."id" = uuid_generate_v5(
              uuid_ns_url(),
              'https://gridassets.local/asset-type/' ||
                asset_type."tenant_id"::text || '/' || $1
            )
            AND NOT EXISTS (
              SELECT 1 FROM "assets" AS asset
              WHERE asset."asset_type_id" = asset_type."id"
                AND asset."tenant_id" = asset_type."tenant_id"
            )
        `,
        [assetType.code]
      );
    }
  }
}
