import { MigrationInterface, QueryRunner } from 'typeorm';

type SeedSite = {
  key: string;
  tenantKey: string;
  code: string;
  name: string;
  type: 'MINE' | 'PLANT' | 'SITE';
};

type SeedAsset = {
  key: string;
  tenantKey: string;
  siteKey: string;
  code: string;
  name: string;
  type: string;
  parentKey: string | null;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  description?: string;
};

const tenants = [
  { key: 'minera-andina', name: 'Empresa Minera Andina' },
  { key: 'energia-pacifico', name: 'Energía del Pacífico' },
];

const sites: SeedSite[] = [
  {
    key: 'andina-norte',
    tenantKey: 'minera-andina',
    code: 'MAN',
    name: 'Mina Andina Norte',
    type: 'MINE',
  },
  {
    key: 'andina-sur',
    tenantKey: 'minera-andina',
    code: 'MAS',
    name: 'Mina Andina Sur',
    type: 'MINE',
  },
  {
    key: 'pacifico-planta',
    tenantKey: 'energia-pacifico',
    code: 'PEP',
    name: 'Planta Eléctrica Pacífico',
    type: 'PLANT',
  },
  {
    key: 'pacifico-cordillera',
    tenantKey: 'energia-pacifico',
    code: 'PEC',
    name: 'Faena Cordillera',
    type: 'SITE',
  },
];

const assets: SeedAsset[] = [
  {
    key: 'a-norte-se-001',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'SE-001',
    name: 'Subestación Chancado',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
    description: 'Subestación principal del área de chancado primario.',
  },
  {
    key: 'a-norte-t1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'TR-001',
    name: 'Transformador T1',
    type: 'POWER_TRANSFORMER',
    parentKey: 'a-norte-se-001',
    status: 'ACTIVE',
    description: 'Transformador de poder 110/23 kV.',
  },
  {
    key: 'a-norte-t1-rad',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'RAD-T1',
    name: 'Banco de radiadores',
    type: 'RADIATOR_BANK',
    parentKey: 'a-norte-t1',
    status: 'ACTIVE',
  },
  {
    key: 'a-norte-t1-bush',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'BUSH-T1',
    name: 'Bushings de alta tensión',
    type: 'BUSHINGS',
    parentKey: 'a-norte-t1',
    status: 'ACTIVE',
  },
  {
    key: 'a-norte-se-002',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'SE-002',
    name: 'Subestación Correas',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
    description: 'Alimenta correas transportadoras y servicios auxiliares.',
  },
  {
    key: 'a-norte-control-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'SC-001',
    name: 'Sala de control',
    type: 'CONTROL_ROOM',
    parentKey: 'a-norte-se-002',
    status: 'ACTIVE',
  },
  {
    key: 'a-norte-prot-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'PR-001',
    name: 'Tablero de protecciones',
    type: 'PROTECTION_PANEL',
    parentKey: 'a-norte-control-1',
    status: 'ACTIVE',
  },
  {
    key: 'a-norte-com-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-norte',
    code: 'COM-001',
    name: 'Gabinete de comunicaciones',
    type: 'COMMUNICATIONS',
    parentKey: 'a-norte-control-1',
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-se-003',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'SE-003',
    name: 'Subestación Planta Sur',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-t2',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'TR-002',
    name: 'Transformador T2',
    type: 'POWER_TRANSFORMER',
    parentKey: 'a-sur-se-003',
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-t2-oltc',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'OLTC-T2',
    name: 'Cambiador bajo carga',
    type: 'TAP_CHANGER',
    parentKey: 'a-sur-t2',
    status: 'OUT_OF_SERVICE',
  },
  {
    key: 'a-sur-t2-oil',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'OIL-T2',
    name: 'Sistema de aceite',
    type: 'OIL_SYSTEM',
    parentKey: 'a-sur-t2',
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-se-004',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'SE-004',
    name: 'Subestación Servicios Mina',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-breaker-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: '52B-004',
    name: 'Interruptor principal',
    type: 'CIRCUIT_BREAKER',
    parentKey: 'a-sur-se-004',
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-drive-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'MEC-52B-004',
    name: 'Mecanismo de accionamiento',
    type: 'DRIVE_MECHANISM',
    parentKey: 'a-sur-breaker-1',
    status: 'ACTIVE',
  },
  {
    key: 'a-sur-ct-1',
    tenantKey: 'minera-andina',
    siteKey: 'andina-sur',
    code: 'TC-004',
    name: 'Transformador de corriente',
    type: 'CURRENT_TRANSFORMER',
    parentKey: 'a-sur-se-004',
    status: 'INACTIVE',
  },
  {
    key: 'p-planta-se-101',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'SE-101',
    name: 'Subestación Generación',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-gsu-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'GSU-01',
    name: 'Transformador elevador GSU-1',
    type: 'POWER_TRANSFORMER',
    parentKey: 'p-planta-se-101',
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-cool-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'ENF-GSU-01',
    name: 'Sistema de enfriamiento',
    type: 'COOLING_SYSTEM',
    parentKey: 'p-planta-gsu-1',
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-fans-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'VEN-GSU-01',
    name: 'Grupo de ventiladores',
    type: 'FAN_GROUP',
    parentKey: 'p-planta-cool-1',
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-se-102',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'SE-102',
    name: 'Subestación Servicios Auxiliares',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-tss-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'TSA-01',
    name: 'Transformador de servicios',
    type: 'AUXILIARY_TRANSFORMER',
    parentKey: 'p-planta-se-102',
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-panel-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'TSA-BT-01',
    name: 'Tablero de baja tensión',
    type: 'LOW_VOLTAGE_PANEL',
    parentKey: 'p-planta-tss-1',
    status: 'ACTIVE',
  },
  {
    key: 'p-planta-ups-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-planta',
    code: 'UPS-01',
    name: 'UPS de control',
    type: 'UPS',
    parentKey: 'p-planta-se-102',
    status: 'OUT_OF_SERVICE',
  },
  {
    key: 'p-cord-se-201',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'SE-201',
    name: 'Subestación Campamento',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-tr-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'TR-201',
    name: 'Transformador de distribución',
    type: 'DISTRIBUTION_TRANSFORMER',
    parentKey: 'p-cord-se-201',
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-cell-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'CEL-201-A',
    name: 'Celda de media tensión A',
    type: 'MEDIUM_VOLTAGE_CELL',
    parentKey: 'p-cord-se-201',
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-relay-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'REL-201-A',
    name: 'Relé de protección',
    type: 'PROTECTION_RELAY',
    parentKey: 'p-cord-cell-1',
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-se-202',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'SE-202',
    name: 'Subestación Bombeo',
    type: 'SUBSTATION',
    parentKey: null,
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-feeder-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'ALI-202-01',
    name: 'Alimentador Bombas 1',
    type: 'FEEDER',
    parentKey: 'p-cord-se-202',
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-breaker-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: '52B-202-01',
    name: 'Interruptor Alimentador 1',
    type: 'CIRCUIT_BREAKER',
    parentKey: 'p-cord-feeder-1',
    status: 'ACTIVE',
  },
  {
    key: 'p-cord-control-1',
    tenantKey: 'energia-pacifico',
    siteKey: 'pacifico-cordillera',
    code: 'SC-202',
    name: 'Sala de control bombeo',
    type: 'CONTROL_ROOM',
    parentKey: 'p-cord-se-202',
    status: 'INACTIVE',
  },
];

const uuidName = (kind: 'tenant' | 'site' | 'asset', key: string) =>
  `https://gridassets.local/${kind}/${key}`;

export class SeedInspectionCatalog1799100100000 implements MigrationInterface {
  name = 'SeedInspectionCatalog1799100100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tenant of tenants) {
      await queryRunner.query(
        `
          INSERT INTO "tenants" ("id", "name")
          VALUES (uuid_generate_v5(uuid_ns_url(), $1), $2)
          ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name"
        `,
        [uuidName('tenant', tenant.key), tenant.name]
      );
    }

    for (const site of sites) {
      await queryRunner.query(
        `
          INSERT INTO "sites" ("id", "tenant_id", "code", "name", "type", "active")
          VALUES (
            uuid_generate_v5(uuid_ns_url(), $1),
            uuid_generate_v5(uuid_ns_url(), $2),
            $3, $4, $5, true
          )
          ON CONFLICT ("id") DO UPDATE SET
            "tenant_id" = EXCLUDED."tenant_id",
            "code" = EXCLUDED."code",
            "name" = EXCLUDED."name",
            "type" = EXCLUDED."type",
            "active" = EXCLUDED."active"
        `,
        [
          uuidName('site', site.key),
          uuidName('tenant', site.tenantKey),
          site.code,
          site.name,
          site.type,
        ]
      );
    }

    for (const asset of assets) {
      await queryRunner.query(
        `
          INSERT INTO "assets" (
            "id", "tenant_id", "site_id", "code", "name", "type",
            "parent_id", "status", "description"
          )
          VALUES (
            uuid_generate_v5(uuid_ns_url(), $1),
            uuid_generate_v5(uuid_ns_url(), $2),
            uuid_generate_v5(uuid_ns_url(), $3),
            $4, $5, $6,
            CASE WHEN $7::text IS NULL THEN NULL
              ELSE uuid_generate_v5(uuid_ns_url(), $7) END,
            $8, $9
          )
          ON CONFLICT ("id") DO UPDATE SET
            "tenant_id" = EXCLUDED."tenant_id",
            "site_id" = EXCLUDED."site_id",
            "code" = EXCLUDED."code",
            "name" = EXCLUDED."name",
            "type" = EXCLUDED."type",
            "parent_id" = EXCLUDED."parent_id",
            "status" = EXCLUDED."status",
            "description" = EXCLUDED."description"
        `,
        [
          uuidName('asset', asset.key),
          uuidName('tenant', asset.tenantKey),
          uuidName('site', asset.siteKey),
          asset.code,
          asset.name,
          asset.type,
          asset.parentKey ? uuidName('asset', asset.parentKey) : null,
          asset.status,
          asset.description ?? null,
        ]
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tenant of tenants) {
      await queryRunner.query(
        `DELETE FROM "tenants" WHERE "id" = uuid_generate_v5(uuid_ns_url(), $1)`,
        [uuidName('tenant', tenant.key)]
      );
    }
  }
}
