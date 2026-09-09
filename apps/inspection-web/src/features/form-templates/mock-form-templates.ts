import type { Concept } from '../concepts/models';
import type { WorkType } from '../work-types/models';
import type { FormItem, FormSection, FormTemplate } from './models';

type ItemDefinition =
  | { type: 'TASK'; title: string; description?: string; required?: boolean }
  | { type: 'CONCEPT'; conceptCode: string; required?: boolean };

type SectionDefinition = {
  title: string;
  description?: string;
  items: ItemDefinition[];
};

type TemplateDefinition = {
  workTypeCode: string;
  name: string;
  description: string;
  sections: SectionDefinition[];
};

const definitions: TemplateDefinition[] = [
  {
    workTypeCode: 'VISUAL_INSPECTION',
    name: 'Inspección general de transformador',
    description:
      'Plantilla base para revisar condiciones visibles y registrar observaciones.',
    sections: [
      {
        title: 'Condiciones generales',
        description: 'Seguridad, acceso y condiciones del entorno.',
        items: [
          {
            type: 'TASK',
            title: 'Verificar acceso seguro al equipo',
            required: true,
          },
          {
            type: 'CONCEPT',
            conceptCode: 'TEMP_AMBIENTE',
            required: false,
          },
        ],
      },
      {
        title: 'Estado eléctrico',
        items: [
          {
            type: 'CONCEPT',
            conceptCode: 'ESTADO_PUESTA_TIERRA',
            required: true,
          },
          {
            type: 'CONCEPT',
            conceptCode: 'TENSION_NOMINAL',
            required: false,
          },
        ],
      },
      {
        title: 'Estado mecánico',
        items: [
          {
            type: 'TASK',
            title: 'Revisar gabinete y elementos de fijación',
            required: true,
          },
          {
            type: 'CONCEPT',
            conceptCode: 'ESTADO_GABINETE',
            required: true,
          },
        ],
      },
      {
        title: 'Observaciones',
        items: [
          {
            type: 'CONCEPT',
            conceptCode: 'OBSERVACION_GENERAL',
            required: false,
          },
        ],
      },
    ],
  },
  {
    workTypeCode: 'PREVENTIVE_MAINTENANCE',
    name: 'Mantenimiento preventivo de transformador',
    description:
      'Secuencia básica de actividades y datos de referencia del mantenimiento.',
    sections: [
      {
        title: 'Preparación',
        items: [
          {
            type: 'TASK',
            title: 'Confirmar identificación y condición segura del equipo',
            required: true,
          },
        ],
      },
      {
        title: 'Condiciones térmicas',
        items: [
          {
            type: 'CONCEPT',
            conceptCode: 'TEMP_AMBIENTE',
            required: true,
          },
          {
            type: 'CONCEPT',
            conceptCode: 'TEMP_ACEITE',
            required: true,
          },
        ],
      },
      {
        title: 'Componentes',
        items: [
          {
            type: 'TASK',
            title: 'Limpiar aisladores y superficies accesibles',
            required: true,
          },
          {
            type: 'TASK',
            title: 'Verificar apriete visible de conexiones',
            required: true,
          },
        ],
      },
      {
        title: 'Cierre',
        items: [
          {
            type: 'CONCEPT',
            conceptCode: 'COMENTARIO_TECNICO',
            required: false,
          },
        ],
      },
    ],
  },
];

export type FormTemplateSeed = {
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
};

export function createFormTemplateSeed(
  tenantId: string,
  workTypes: WorkType[],
  concepts: Concept[]
): FormTemplateSeed {
  const workTypeByCode = new Map(
    workTypes
      .filter((workType) => workType.tenantId === tenantId)
      .map((workType) => [workType.code, workType])
  );
  const conceptByCode = new Map(
    concepts
      .filter((concept) => concept.tenantId === tenantId)
      .map((concept) => [concept.code, concept])
  );
  const templates: FormTemplate[] = [];
  const sections: FormSection[] = [];
  const items: FormItem[] = [];

  for (const definition of definitions) {
    const workType = workTypeByCode.get(definition.workTypeCode);
    if (!workType) continue;
    const template: FormTemplate = {
      id: crypto.randomUUID(),
      tenantId,
      workTypeId: workType.id,
      name: definition.name,
      description: definition.description,
      version: 1,
      active: true,
    };
    templates.push(template);

    definition.sections.forEach((sectionDefinition, sectionIndex) => {
      const section: FormSection = {
        id: crypto.randomUUID(),
        tenantId,
        formTemplateId: template.id,
        title: sectionDefinition.title,
        description: sectionDefinition.description ?? null,
        order: sectionIndex + 1,
      };
      sections.push(section);

      sectionDefinition.items.forEach((itemDefinition, itemIndex) => {
        if (itemDefinition.type === 'CONCEPT') {
          const concept = conceptByCode.get(itemDefinition.conceptCode);
          if (!concept) return;
          items.push({
            id: crypto.randomUUID(),
            tenantId,
            sectionId: section.id,
            type: 'CONCEPT',
            order: itemIndex + 1,
            title: null,
            description: null,
            conceptId: concept.id,
            required: itemDefinition.required ?? false,
          });
          return;
        }

        items.push({
          id: crypto.randomUUID(),
          tenantId,
          sectionId: section.id,
          type: 'TASK',
          order: itemIndex + 1,
          title: itemDefinition.title,
          description: itemDefinition.description ?? null,
          conceptId: null,
          required: itemDefinition.required ?? false,
        });
      });
    });
  }

  return { templates, sections, items };
}
