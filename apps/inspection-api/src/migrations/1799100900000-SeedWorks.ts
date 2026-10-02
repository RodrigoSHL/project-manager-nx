import { MigrationInterface, QueryRunner } from 'typeorm';

type PairRow = {
  asset_id: string;
  asset_name: string;
  site_id: string;
  work_type_id: string;
  work_type_name: string;
  template_id: string;
  template_name: string;
  template_version: number;
};

type SectionRow = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
};

type ItemRow = {
  id: string;
  section_id: string;
  type: 'CONCEPT' | 'TASK';
  sort_order: number;
  title: string | null;
  description: string | null;
  required: boolean;
  concept_id: string | null;
  concept_code: string | null;
  concept_name: string | null;
  concept_description: string | null;
  concept_type: 'ANALOG' | 'DIGITAL' | 'TEXT' | 'HIDDEN' | null;
  concept_unit: string | null;
};

type OptionRow = {
  id: string;
  concept_id: string;
  label: string;
  value: string;
  sort_order: number;
};

const statuses = [
  'IN_PROGRESS',
  'FINISHED',
  'DRAFT',
  'REVIEWED',
  'IN_PROGRESS',
];
const people = [
  'Juan Pérez',
  'María Soto',
  'Carlos Rojas',
  'Ana Morales',
  'Diego Silva',
];

export class SeedWorks1799100900000 implements MigrationInterface {
  name = 'SeedWorks1799100900000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT "id" FROM "tenants"`
    )) as Array<{
      id: string;
    }>;
    for (const tenant of tenants) {
      const pairs = (await queryRunner.query(
        `SELECT asset."id" AS asset_id,
                asset."name" AS asset_name,
                asset."site_id" AS site_id,
                work_type."id" AS work_type_id,
                work_type."name" AS work_type_name,
                template."id" AS template_id,
                template."name" AS template_name,
                template."version" AS template_version
         FROM "assets" AS asset
         INNER JOIN "asset_type_work_types" AS type_rule
           ON type_rule."tenant_id" = asset."tenant_id"
          AND type_rule."asset_type_id" = asset."asset_type_id"
         INNER JOIN "work_types" AS work_type
           ON work_type."id" = type_rule."work_type_id"
          AND work_type."tenant_id" = asset."tenant_id"
         INNER JOIN "form_templates" AS template
           ON template."work_type_id" = work_type."id"
          AND template."tenant_id" = asset."tenant_id"
          AND template."active" = true
         LEFT JOIN "asset_work_types" AS asset_rule
           ON asset_rule."tenant_id" = asset."tenant_id"
          AND asset_rule."asset_id" = asset."id"
          AND asset_rule."work_type_id" = work_type."id"
         WHERE asset."tenant_id" = $1
           AND work_type."active" = true
           AND COALESCE(asset_rule."enabled", type_rule."enabled", false) = true
         ORDER BY asset."code", work_type."code"
         LIMIT 5`,
        [tenant.id]
      )) as PairRow[];

      for (const [index, pair] of pairs.entries()) {
        const [idRow] = (await queryRunner.query(
          `SELECT uuid_generate_v5(
             uuid_ns_url(),
             'https://gridassets.local/work/' || $1::text || '/' || $2::text
           ) AS id`,
          [tenant.id, index + 1]
        )) as Array<{ id: string }>;
        const snapshot = await buildSnapshot(
          queryRunner,
          tenant.id,
          idRow.id,
          pair
        );
        await queryRunner.query(
          `INSERT INTO "works" (
             "id", "tenant_id", "site_id", "asset_id", "work_type_id",
             "form_template_id", "form_template_version", "title",
             "execution_date", "responsible", "company", "status", "notes",
             "form_snapshot", "created_at", "updated_at"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8,
             CURRENT_DATE - $9::integer, $10, $11, $12::work_status_enum, $13,
             $14::jsonb, now() - ($9::text || ' days')::interval,
             now() - ($9::text || ' days')::interval
           ) ON CONFLICT ("id") DO NOTHING`,
          [
            idRow.id,
            tenant.id,
            pair.site_id,
            pair.asset_id,
            pair.work_type_id,
            pair.template_id,
            pair.template_version,
            `${pair.work_type_name} · ${pair.asset_name}`,
            index,
            people[index],
            index % 2 === 0
              ? 'Cuadrilla eléctrica interna'
              : 'Servicios Andinos',
            statuses[index],
            index === 0
              ? 'Ejecución de ejemplo parcialmente completada.'
              : null,
            JSON.stringify(snapshot),
          ]
        );
        await seedResponses(
          queryRunner,
          tenant.id,
          idRow.id,
          snapshot,
          statuses[index],
          index
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "works"
      WHERE "id" IN (
        SELECT uuid_generate_v5(
          uuid_ns_url(),
          'https://gridassets.local/work/' || tenant."id"::text || '/' || series::text
        )
        FROM "tenants" AS tenant
        CROSS JOIN generate_series(1, 5) AS series
      )
    `);
  }
}

async function buildSnapshot(
  queryRunner: QueryRunner,
  tenantId: string,
  workId: string,
  pair: PairRow
) {
  const sections = (await queryRunner.query(
    `SELECT "id", "title", "description", "sort_order"
     FROM "form_sections"
     WHERE "tenant_id" = $1 AND "form_template_id" = $2
     ORDER BY "sort_order"`,
    [tenantId, pair.template_id]
  )) as SectionRow[];
  const items = (await queryRunner.query(
    `SELECT item."id", item."section_id", item."type", item."sort_order",
            item."title", item."description", item."required", item."concept_id",
            concept."code" AS concept_code, concept."name" AS concept_name,
            concept."description" AS concept_description,
            concept."type" AS concept_type, concept."unit" AS concept_unit
     FROM "form_items" AS item
     INNER JOIN "form_sections" AS section
       ON section."id" = item."section_id" AND section."tenant_id" = item."tenant_id"
     LEFT JOIN "concepts" AS concept
       ON concept."id" = item."concept_id" AND concept."tenant_id" = item."tenant_id"
     WHERE item."tenant_id" = $1 AND section."form_template_id" = $2
     ORDER BY section."sort_order", item."sort_order"`,
    [tenantId, pair.template_id]
  )) as ItemRow[];
  const options = (await queryRunner.query(
    `SELECT option."id", option."concept_id", option."label", option."value",
            option."sort_order"
     FROM "concept_options" AS option
     WHERE option."tenant_id" = $1 AND option."active" = true
     ORDER BY option."sort_order"`,
    [tenantId]
  )) as OptionRow[];

  return {
    workId,
    tenantId,
    formTemplateId: pair.template_id,
    formTemplateVersion: pair.template_version,
    name: pair.template_name,
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.sort_order,
      items: items
        .filter((item) => item.section_id === section.id)
        .map((item) => ({
          id: item.id,
          type: item.type,
          order: item.sort_order,
          title: item.title,
          description: item.description,
          required: item.required,
          concept: item.concept_id
            ? {
                id: item.concept_id,
                code: item.concept_code,
                name: item.concept_name,
                description: item.concept_description,
                type: item.concept_type,
                unit: item.concept_unit,
                options: options
                  .filter((option) => option.concept_id === item.concept_id)
                  .map((option) => ({
                    id: option.id,
                    label: option.label,
                    value: option.value,
                    order: option.sort_order,
                  })),
              }
            : undefined,
        })),
    })),
  };
}

async function seedResponses(
  queryRunner: QueryRunner,
  tenantId: string,
  workId: string,
  snapshot: Awaited<ReturnType<typeof buildSnapshot>>,
  status: string,
  seedIndex: number
) {
  const items = snapshot.sections.flatMap((section) => section.items);
  const conceptItems = items.filter(
    (item) => item.type === 'CONCEPT' && item.concept?.type !== 'HIDDEN'
  );
  const selected =
    status === 'FINISHED' || status === 'REVIEWED'
      ? conceptItems
      : status === 'DRAFT'
      ? []
      : conceptItems.slice(0, 2);
  for (const [index, item] of selected.entries()) {
    if (!item.concept) continue;
    const numberValue =
      item.concept.type === 'ANALOG' ? 68 + seedIndex * 2 + index : null;
    const textValue =
      item.concept.type === 'TEXT' ? 'Sin novedades relevantes.' : null;
    const optionId =
      item.concept.type === 'DIGITAL'
        ? item.concept.options[0]?.id ?? null
        : null;
    if (numberValue === null && textValue === null && optionId === null)
      continue;
    await queryRunner.query(
      `INSERT INTO "concept_responses" (
         "id", "tenant_id", "work_id", "form_item_id", "concept_id",
         "value_number", "value_text", "selected_option_id"
       ) VALUES (
         uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/response/' || $1::text || '/' || $2::text || '/' || $3::text),
         $1::uuid, $2::uuid, $3::uuid, $4::uuid,
         $5::double precision, $6::text, $7::uuid
       ) ON CONFLICT ("id") DO NOTHING`,
      [
        tenantId,
        workId,
        item.id,
        item.concept.id,
        numberValue,
        textValue,
        optionId,
      ]
    );
  }
  if (status === 'FINISHED' || status === 'REVIEWED') {
    for (const item of items.filter((value) => value.type === 'TASK')) {
      await queryRunner.query(
        `INSERT INTO "task_completions" (
           "id", "tenant_id", "work_id", "form_item_id", "completed"
         ) VALUES (
           uuid_generate_v5(uuid_ns_url(), 'https://gridassets.local/task-completion/' || $1::text || '/' || $2::text || '/' || $3::text),
           $1::uuid, $2::uuid, $3::uuid, true
         ) ON CONFLICT ("id") DO NOTHING`,
        [tenantId, workId, item.id]
      );
    }
  }
}
