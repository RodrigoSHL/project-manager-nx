import { MigrationInterface, QueryRunner } from 'typeorm';

type ItemDefinition =
  | { type: 'TASK'; title: string; description?: string; required?: boolean }
  | { type: 'CONCEPT'; conceptCode: string; required?: boolean };

type TemplateDefinition = {
  workTypeCode: string;
  name: string;
  description: string;
  sections: Array<{
    title: string;
    description?: string;
    items: ItemDefinition[];
  }>;
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

export class SeedFormTemplates1799100700000 implements MigrationInterface {
  name = 'SeedFormTemplates1799100700000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const definition of definitions) {
      await queryRunner.query(
        `INSERT INTO "form_templates" ("id", "tenant_id", "work_type_id", "name", "description", "version", "active")
         SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/form-template/' || work_type."tenant_id"::text || '/' || $1 || '/v1'),
                work_type."tenant_id", work_type."id", $2, $3, 1, true
         FROM "work_types" AS work_type
         WHERE work_type."code" = $1
         ON CONFLICT ("tenant_id", "work_type_id", "version") DO UPDATE SET
           "name" = EXCLUDED."name", "description" = EXCLUDED."description"`,
        [definition.workTypeCode, definition.name, definition.description]
      );

      for (const [
        sectionIndex,
        sectionDefinition,
      ] of definition.sections.entries()) {
        await queryRunner.query(
          `INSERT INTO "form_sections" ("id", "tenant_id", "form_template_id", "title", "description", "sort_order")
           SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/form-section/' || template."tenant_id"::text || '/' || $1 || '/' || $2::text),
                  template."tenant_id", template."id", $3, $4, $2::integer
           FROM "form_templates" AS template
           INNER JOIN "work_types" AS work_type
             ON work_type."id" = template."work_type_id"
            AND work_type."tenant_id" = template."tenant_id"
           WHERE work_type."code" = $1 AND template."version" = 1
           ON CONFLICT ("tenant_id", "form_template_id", "sort_order") DO UPDATE SET
             "title" = EXCLUDED."title", "description" = EXCLUDED."description"`,
          [
            definition.workTypeCode,
            sectionIndex + 1,
            sectionDefinition.title,
            sectionDefinition.description ?? null,
          ]
        );

        for (const [itemIndex, item] of sectionDefinition.items.entries()) {
          if (item.type === 'CONCEPT') {
            await queryRunner.query(
              `INSERT INTO "form_items" ("id", "tenant_id", "section_id", "type", "sort_order", "title", "description", "concept_id", "required")
               SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/form-item/' || section."tenant_id"::text || '/' || $1 || '/' || $2::text || '/' || $3::text),
                      section."tenant_id", section."id", 'CONCEPT', $3::integer, NULL, NULL, concept."id", $5
               FROM "form_sections" AS section
               INNER JOIN "form_templates" AS template
                 ON template."id" = section."form_template_id"
                AND template."tenant_id" = section."tenant_id"
               INNER JOIN "work_types" AS work_type
                 ON work_type."id" = template."work_type_id"
                AND work_type."tenant_id" = template."tenant_id"
               INNER JOIN "concepts" AS concept
                 ON concept."tenant_id" = section."tenant_id"
                AND concept."code" = $4
               WHERE work_type."code" = $1 AND template."version" = 1
                 AND section."sort_order" = $2::integer
               ON CONFLICT ("tenant_id", "section_id", "sort_order") DO NOTHING`,
              [
                definition.workTypeCode,
                sectionIndex + 1,
                itemIndex + 1,
                item.conceptCode,
                item.required ?? false,
              ]
            );
          } else {
            await queryRunner.query(
              `INSERT INTO "form_items" ("id", "tenant_id", "section_id", "type", "sort_order", "title", "description", "concept_id", "required")
               SELECT uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/form-item/' || section."tenant_id"::text || '/' || $1 || '/' || $2::text || '/' || $3::text),
                      section."tenant_id", section."id", 'TASK', $3::integer, $4, $5, NULL, $6
               FROM "form_sections" AS section
               INNER JOIN "form_templates" AS template
                 ON template."id" = section."form_template_id"
                AND template."tenant_id" = section."tenant_id"
               INNER JOIN "work_types" AS work_type
                 ON work_type."id" = template."work_type_id"
                AND work_type."tenant_id" = template."tenant_id"
               WHERE work_type."code" = $1 AND template."version" = 1
                 AND section."sort_order" = $2::integer
               ON CONFLICT ("tenant_id", "section_id", "sort_order") DO NOTHING`,
              [
                definition.workTypeCode,
                sectionIndex + 1,
                itemIndex + 1,
                item.title,
                item.description ?? null,
                item.required ?? false,
              ]
            );
          }
        }
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "form_templates" AS template
       USING "work_types" AS work_type
       WHERE work_type."id" = template."work_type_id"
         AND work_type."tenant_id" = template."tenant_id"
         AND work_type."code" IN ('VISUAL_INSPECTION', 'PREVENTIVE_MAINTENANCE')
         AND template."version" = 1`
    );
  }
}
