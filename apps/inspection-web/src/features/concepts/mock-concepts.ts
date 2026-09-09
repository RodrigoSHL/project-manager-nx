import type { AssetType } from '../asset-types/models';
import type {
  AssetTypeConcept,
  Concept,
  ConceptOption,
  ConceptType,
} from './models';

type ConceptDefinition = {
  code: string;
  name: string;
  description: string;
  type: ConceptType;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
};

const conceptDefinitions: ConceptDefinition[] = [
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

const conceptsByAssetTypeCode: Record<string, string[]> = {
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

export type ConceptSeed = {
  concepts: Concept[];
  options: ConceptOption[];
  assetTypeConcepts: AssetTypeConcept[];
};

export function createConceptSeed(
  tenantId: string,
  assetTypes: AssetType[]
): ConceptSeed {
  const concepts = conceptDefinitions.map<Concept>((definition) => ({
    id: crypto.randomUUID(),
    tenantId,
    code: definition.code,
    name: definition.name,
    description: definition.description,
    type: definition.type,
    unit: definition.unit ?? null,
    active: true,
  }));
  const conceptByCode = new Map(
    concepts.map((concept) => [concept.code, concept])
  );
  const definitionByCode = new Map(
    conceptDefinitions.map((definition) => [definition.code, definition])
  );
  const options = concepts.flatMap<ConceptOption>((concept) =>
    (definitionByCode.get(concept.code)?.options ?? []).map(
      (option, index) => ({
        id: crypto.randomUUID(),
        tenantId,
        conceptId: concept.id,
        value: option.value,
        label: option.label,
        order: index + 1,
        active: true,
      })
    )
  );
  const assetTypeConcepts = assetTypes.flatMap<AssetTypeConcept>((assetType) =>
    (conceptsByAssetTypeCode[assetType.code] ?? []).flatMap(
      (conceptCode, index) => {
        const concept = conceptByCode.get(conceptCode);
        return concept
          ? [
              {
                id: crypto.randomUUID(),
                tenantId,
                assetTypeId: assetType.id,
                conceptId: concept.id,
                order: index + 1,
                active: true,
              },
            ]
          : [];
      }
    )
  );

  return { concepts, options, assetTypeConcepts };
}
