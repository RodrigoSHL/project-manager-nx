import { MigrationInterface, QueryRunner } from 'typeorm';

type ConceptDefinition = {
  code: string;
  name: string;
  description: string;
  type: 'ANALOG' | 'DIGITAL' | 'TEXT' | 'HIDDEN';
  unit?: string;
  options?: Array<{ value: string; label: string }>;
};

const concepts: ConceptDefinition[] = [
  {
    code: 'TEMP_AMBIENTE',
    name: 'Temperatura ambiente',
    description: 'Temperatura del entorno al momento de la revisión.',
    type: 'ANALOG',
    unit: '°C',
  },
  {
    code: 'TEMP_ACEITE',
    name: 'Temperatura de aceite',
    description: 'Temperatura del aceite aislante del equipo.',
    type: 'ANALOG',
    unit: '°C',
  },
  {
    code: 'CORRIENTE_NOMINAL',
    name: 'Corriente nominal',
    description: 'Corriente nominal indicada por el fabricante.',
    type: 'ANALOG',
    unit: 'A',
  },
  {
    code: 'TENSION_NOMINAL',
    name: 'Tensión nominal',
    description: 'Tensión nominal de operación del equipo.',
    type: 'ANALOG',
    unit: 'kV',
  },
  {
    code: 'HUMEDAD_AMBIENTE',
    name: 'Humedad ambiente',
    description: 'Humedad relativa presente en el recinto.',
    type: 'ANALOG',
    unit: '%',
  },
  {
    code: 'FRECUENCIA_NOMINAL',
    name: 'Frecuencia nominal',
    description: 'Frecuencia nominal del sistema eléctrico.',
    type: 'ANALOG',
    unit: 'Hz',
  },
  {
    code: 'PRESION_SF6',
    name: 'Presión de SF6',
    description: 'Presión del gas aislante del interruptor.',
    type: 'ANALOG',
    unit: 'bar',
  },
  {
    code: 'TENSION_BANCO_BATERIAS',
    name: 'Tensión del banco de baterías',
    description: 'Tensión nominal del sistema de corriente continua.',
    type: 'ANALOG',
    unit: 'V',
  },
  {
    code: 'ESTADO_SENALIZACION',
    name: 'Estado de señalización',
    description: 'Disponibilidad de luces, letreros y señalización visible.',
    type: 'DIGITAL',
    options: [
      { value: 'NORMAL', label: 'Normal' },
      { value: 'PARTIAL_MISSING', label: 'Faltan algunas' },
      { value: 'MANY_MISSING', label: 'Faltan muchas' },
    ],
  },
  {
    code: 'ESTADO_PUESTA_TIERRA',
    name: 'Estado de puesta a tierra',
    description: 'Condición visual de la conexión de puesta a tierra.',
    type: 'DIGITAL',
    options: [
      { value: 'CONNECTED', label: 'Conectada' },
      { value: 'DETERIORATED', label: 'Deteriorada' },
      { value: 'DISCONNECTED', label: 'Desconectada' },
    ],
  },
  {
    code: 'ESTADO_GABINETE',
    name: 'Estado del gabinete',
    description: 'Condición general de puertas, sellos y estructura.',
    type: 'DIGITAL',
    options: [
      { value: 'GOOD', label: 'Buen estado' },
      { value: 'OBSERVATION', label: 'Con observaciones' },
      { value: 'DAMAGED', label: 'Dañado' },
    ],
  },
  {
    code: 'ESTADO_VENTILACION',
    name: 'Estado de ventilación',
    description: 'Condición del sistema de ventilación del recinto.',
    type: 'DIGITAL',
    options: [
      { value: 'OPERATIVE', label: 'Operativa' },
      { value: 'PARTIAL', label: 'Operación parcial' },
      { value: 'OUT_OF_SERVICE', label: 'Fuera de servicio' },
    ],
  },
  {
    code: 'OBSERVACION_GENERAL',
    name: 'Observación general',
    description: 'Espacio para una descripción técnica libre.',
    type: 'TEXT',
  },
  {
    code: 'COMENTARIO_TECNICO',
    name: 'Comentario técnico',
    description: 'Comentario complementario del especialista.',
    type: 'TEXT',
  },
  {
    code: 'REFERENCIA_INTERNA',
    name: 'Referencia interna',
    description: 'Dato auxiliar reservado para configuraciones futuras.',
    type: 'HIDDEN',
  },
];

const conceptsByAssetType: Record<string, string[]> = {
  POWER_TRANSFORMER: [
    'TEMP_AMBIENTE',
    'TEMP_ACEITE',
    'CORRIENTE_NOMINAL',
    'TENSION_NOMINAL',
    'ESTADO_PUESTA_TIERRA',
    'OBSERVACION_GENERAL',
    'REFERENCIA_INTERNA',
  ],
  CIRCUIT_BREAKER: [
    'TEMP_AMBIENTE',
    'CORRIENTE_NOMINAL',
    'TENSION_NOMINAL',
    'PRESION_SF6',
    'ESTADO_PUESTA_TIERRA',
    'COMENTARIO_TECNICO',
  ],
  CONTROL_ROOM: [
    'TEMP_AMBIENTE',
    'HUMEDAD_AMBIENTE',
    'FRECUENCIA_NOMINAL',
    'ESTADO_SENALIZACION',
    'ESTADO_GABINETE',
    'ESTADO_VENTILACION',
    'OBSERVACION_GENERAL',
  ],
  BATTERY_BANK: [
    'TEMP_AMBIENTE',
    'HUMEDAD_AMBIENTE',
    'TENSION_BANCO_BATERIAS',
    'ESTADO_GABINETE',
    'OBSERVACION_GENERAL',
  ],
};

export class SeedConceptCatalogs1799100500000 implements MigrationInterface {
  name = 'SeedConceptCatalogs1799100500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const concept of concepts) {
      await queryRunner.query(
        `INSERT INTO "concepts" ("id", "tenant_id", "code", "name", "description", "type", "unit", "active")
         SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/concept/' || "id"::text || '/' || $1),
                "id", $1, $2, $3, $4::"concept_type_enum", $5, true
         FROM "tenants"
         ON CONFLICT ("tenant_id", "code") DO UPDATE SET
           "name" = EXCLUDED."name", "description" = EXCLUDED."description",
           "type" = EXCLUDED."type", "unit" = EXCLUDED."unit", "active" = true`,
        [
          concept.code,
          concept.name,
          concept.description,
          concept.type,
          concept.unit ?? null,
        ]
      );

      for (const [index, option] of (concept.options ?? []).entries()) {
        await queryRunner.query(
          `INSERT INTO "concept_options" ("id", "tenant_id", "concept_id", "value", "label", "sort_order", "active")
           SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/concept-option/' || concept."tenant_id"::text || '/' || $1 || '/' || $2),
                  concept."tenant_id", concept."id", $2, $3, $4, true
           FROM "concepts" AS concept WHERE concept."code" = $1
           ON CONFLICT ("tenant_id", "concept_id", "value") DO UPDATE SET
             "label" = EXCLUDED."label", "sort_order" = EXCLUDED."sort_order", "active" = true`,
          [concept.code, option.value, option.label, index + 1]
        );
      }
    }

    for (const [assetTypeCode, conceptCodes] of Object.entries(
      conceptsByAssetType
    )) {
      for (const [index, conceptCode] of conceptCodes.entries()) {
        await queryRunner.query(
          `INSERT INTO "asset_type_concepts" ("id", "tenant_id", "asset_type_id", "concept_id", "sort_order", "active")
           SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/asset-type-concept/' || asset_type."tenant_id"::text || '/' || $1 || '/' || $2),
                  asset_type."tenant_id", asset_type."id", concept."id", $3, true
           FROM "asset_types" AS asset_type
           INNER JOIN "concepts" AS concept ON concept."tenant_id" = asset_type."tenant_id" AND concept."code" = $2
           WHERE asset_type."code" = $1
           ON CONFLICT ("tenant_id", "asset_type_id", "concept_id") DO UPDATE SET
             "sort_order" = EXCLUDED."sort_order", "active" = true`,
          [assetTypeCode, conceptCode, index + 1]
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "asset_type_concepts"`);
    await queryRunner.query(`DELETE FROM "concept_options"`);
    await queryRunner.query(`DELETE FROM "concepts"`);
  }
}
