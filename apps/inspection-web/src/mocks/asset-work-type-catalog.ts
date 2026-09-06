import type { AssetType } from '../features/asset-types/models';
import type { Tenant } from '../features/assets/models';
import type {
  AssetTypeWorkType,
  AssetWorkType,
  WorkType,
} from '../features/work-types/models';

export const MOCK_TENANT_IDS = {
  MINERA_ANDINA: 'bf1167ca-88d9-56d1-bf7b-833f540aa8da',
  ENERGIA_PACIFICO: '1d3a25cd-5588-5daf-8c48-2593d1f75d70',
} as const;

export const mockCatalogTenants: Tenant[] = [
  { id: MOCK_TENANT_IDS.MINERA_ANDINA, name: 'Empresa Minera Andina' },
  { id: MOCK_TENANT_IDS.ENERGIA_PACIFICO, name: 'Energía del Pacífico' },
];

type CatalogDefinition = {
  code: string;
  name: string;
  description: string;
};

const commonAssetTypeDefinitions: CatalogDefinition[] = [
  {
    code: 'SUBSTATION',
    name: 'Subestación',
    description: 'Nodo superior del árbol de activos de un sitio.',
  },
  {
    code: 'POWER_TRANSFORMER',
    name: 'Transformador de poder',
    description: 'Transformador principal de alta o media tensión.',
  },
  {
    code: 'CIRCUIT_BREAKER',
    name: 'Interruptor',
    description: 'Equipo de maniobra y protección eléctrica.',
  },
  {
    code: 'BATTERY_BANK',
    name: 'Banco de baterías',
    description: 'Sistema de respaldo de corriente continua.',
  },
  {
    code: 'CONTROL_ROOM',
    name: 'Sala de control',
    description: 'Recinto que agrupa control, protección y comunicaciones.',
  },
  {
    code: 'PROTECTION_RELAY',
    name: 'Relé de protección',
    description: 'Dispositivo para detección y despeje de fallas.',
  },
  {
    code: 'RADIATOR_BANK',
    name: 'Banco de radiadores',
    description: 'Conjunto de radiadores para enfriamiento.',
  },
  {
    code: 'BUSHINGS',
    name: 'Bushings',
    description: 'Aisladores pasantes del transformador.',
  },
  {
    code: 'PROTECTION_PANEL',
    name: 'Tablero de protecciones',
    description: 'Gabinete que contiene equipos de protección.',
  },
  {
    code: 'COMMUNICATIONS',
    name: 'Comunicaciones',
    description: 'Equipos y gabinetes de telecomunicaciones.',
  },
  {
    code: 'TAP_CHANGER',
    name: 'Cambiador de tomas',
    description: 'Mecanismo regulador de tensión del transformador.',
  },
  {
    code: 'OIL_SYSTEM',
    name: 'Sistema de aceite',
    description: 'Circuito de aceite aislante del transformador.',
  },
  {
    code: 'DRIVE_MECHANISM',
    name: 'Mecanismo de accionamiento',
    description: 'Mecanismo que opera un equipo de maniobra.',
  },
  {
    code: 'CURRENT_TRANSFORMER',
    name: 'Transformador de corriente',
    description: 'Transformador de medida de corriente.',
  },
  {
    code: 'COOLING_SYSTEM',
    name: 'Sistema de enfriamiento',
    description: 'Sistema auxiliar para disipación térmica.',
  },
  {
    code: 'FAN_GROUP',
    name: 'Grupo de ventiladores',
    description: 'Conjunto de ventiladores de enfriamiento forzado.',
  },
  {
    code: 'AUXILIARY_TRANSFORMER',
    name: 'Transformador de servicios auxiliares',
    description: 'Transformador para consumos auxiliares.',
  },
  {
    code: 'DISTRIBUTION_TRANSFORMER',
    name: 'Transformador de distribución',
    description: 'Transformador para redes de distribución.',
  },
  {
    code: 'LOW_VOLTAGE_PANEL',
    name: 'Tablero de baja tensión',
    description: 'Tablero eléctrico de distribución en baja tensión.',
  },
  {
    code: 'MEDIUM_VOLTAGE_CELL',
    name: 'Celda de media tensión',
    description: 'Celda modular para maniobra en media tensión.',
  },
  {
    code: 'UPS',
    name: 'UPS',
    description: 'Sistema de alimentación ininterrumpida.',
  },
  {
    code: 'FEEDER',
    name: 'Alimentador',
    description: 'Circuito de salida que alimenta una carga.',
  },
];

const workTypeDefinitions: CatalogDefinition[] = [
  {
    code: 'VISUAL_INSPECTION',
    name: 'Inspección visual',
    description: 'Revisión general del estado visible del equipo.',
  },
  {
    code: 'PREVENTIVE_MAINTENANCE',
    name: 'Mantenimiento preventivo',
    description: 'Tareas planificadas para conservar el equipo.',
  },
  {
    code: 'THERMOGRAPHY',
    name: 'Termografía',
    description: 'Inspección mediante imágenes térmicas.',
  },
  {
    code: 'ELECTRICAL_TESTS',
    name: 'Pruebas eléctricas',
    description: 'Mediciones y ensayos sobre variables eléctricas.',
  },
  {
    code: 'PROTECTION_INSPECTION',
    name: 'Inspección de protecciones',
    description: 'Revisión funcional de sistemas de protección.',
  },
  {
    code: 'SPECIAL_ELECTRICAL_TEST',
    name: 'Prueba eléctrica especial',
    description: 'Prueba excepcional habilitada para equipos concretos.',
  },
];

function mockUuid(group: number, tenant: number, index: number) {
  return `${group}${tenant}000000-0000-4000-8000-${String(index).padStart(
    12,
    '0'
  )}`;
}

function buildAssetTypes(tenantId: string, tenantNumber: number): AssetType[] {
  return commonAssetTypeDefinitions.map((definition, index) => ({
    id: mockUuid(1, tenantNumber, index + 1),
    tenantId,
    ...definition,
    active: true,
  }));
}

function buildWorkTypes(tenantId: string, tenantNumber: number): WorkType[] {
  return workTypeDefinitions.map((definition, index) => ({
    id: mockUuid(3, tenantNumber, index + 1),
    tenantId,
    ...definition,
    active: true,
  }));
}

export const mockAssetTypes: AssetType[] = [
  ...buildAssetTypes(MOCK_TENANT_IDS.MINERA_ANDINA, 1),
  ...buildAssetTypes(MOCK_TENANT_IDS.ENERGIA_PACIFICO, 2),
];

export const mockWorkTypes: WorkType[] = [
  ...buildWorkTypes(MOCK_TENANT_IDS.MINERA_ANDINA, 1),
  ...buildWorkTypes(MOCK_TENANT_IDS.ENERGIA_PACIFICO, 2),
];

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

function buildAssetTypeWorkTypes(
  tenantId: string,
  tenantNumber: number
): AssetTypeWorkType[] {
  const assetTypes = mockAssetTypes.filter(
    (item) => item.tenantId === tenantId
  );
  const workTypes = mockWorkTypes.filter((item) => item.tenantId === tenantId);
  let relationIndex = 1;

  return assetTypes.flatMap((assetType) =>
    (workTypeRules[assetType.code] ?? []).flatMap((workTypeCode) => {
      const workType = workTypes.find((item) => item.code === workTypeCode);
      if (!workType) return [];

      return [
        {
          id: mockUuid(5, tenantNumber, relationIndex++),
          tenantId,
          assetTypeId: assetType.id,
          workTypeId: workType.id,
          enabled: true,
        },
      ];
    })
  );
}

export const mockAssetTypeWorkTypes: AssetTypeWorkType[] = [
  ...buildAssetTypeWorkTypes(MOCK_TENANT_IDS.MINERA_ANDINA, 1),
  ...buildAssetTypeWorkTypes(MOCK_TENANT_IDS.ENERGIA_PACIFICO, 2),
];

function workTypeId(tenantId: string, code: string) {
  const workType = mockWorkTypes.find(
    (item) => item.tenantId === tenantId && item.code === code
  );
  if (!workType) throw new Error(`Missing mock work type: ${code}`);
  return workType.id;
}

export const mockAssetWorkTypes: AssetWorkType[] = [
  {
    id: mockUuid(7, 1, 1),
    tenantId: MOCK_TENANT_IDS.MINERA_ANDINA,
    assetId: '404e611c-66da-5374-9951-c3aed9c8c81a',
    workTypeId: workTypeId(
      MOCK_TENANT_IDS.MINERA_ANDINA,
      'SPECIAL_ELECTRICAL_TEST'
    ),
    enabled: true,
  },
  {
    id: mockUuid(7, 1, 2),
    tenantId: MOCK_TENANT_IDS.MINERA_ANDINA,
    assetId: '97be674e-d190-58e7-97e2-3b5ba8902991',
    workTypeId: workTypeId(MOCK_TENANT_IDS.MINERA_ANDINA, 'THERMOGRAPHY'),
    enabled: false,
  },
];
