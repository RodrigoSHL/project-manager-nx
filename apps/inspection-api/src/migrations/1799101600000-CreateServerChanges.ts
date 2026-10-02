import { MigrationInterface, QueryRunner } from 'typeorm';

const triggerDefinitions = [
  ['sites', 'SITE', 'site'],
  ['assets', 'ASSET', 'site'],
  ['asset_types', 'ASSET_TYPE', 'global'],
  ['work_types', 'WORK_TYPE', 'global'],
  ['concepts', 'CONCEPT', 'global'],
  ['concept_options', 'CONCEPT_OPTION', 'global'],
  ['form_templates', 'FORM_TEMPLATE', 'global'],
  ['form_sections', 'FORM_SECTION', 'global'],
  ['form_items', 'FORM_ITEM', 'global'],
  ['works', 'WORK', 'site'],
  ['concept_responses', 'RESPONSE', 'work'],
  ['task_completions', 'TASK_COMPLETION', 'work'],
  ['work_item_annotations', 'ANNOTATION', 'work'],
] as const;

export class CreateServerChanges1799101600000 implements MigrationInterface {
  name = 'CreateServerChanges1799101600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "server_changes" (
        "sequence" bigserial PRIMARY KEY,
        "tenant_id" uuid NOT NULL,
        "site_id" uuid,
        "source_device_id" uuid,
        "entity_type" varchar(32) NOT NULL,
        "entity_id" uuid NOT NULL,
        "operation" varchar(10) NOT NULL,
        "payload" jsonb NOT NULL,
        "changed_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
        CONSTRAINT "FK_server_changes_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_server_changes_operation" CHECK (
          "operation" IN ('CREATE', 'UPDATE', 'DELETE')
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_server_changes_tenant_sequence"
      ON "server_changes" ("tenant_id", "sequence")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_server_changes_tenant_site_sequence"
      ON "server_changes" ("tenant_id", "site_id", "sequence")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION record_server_change()
      RETURNS trigger AS $$
      DECLARE
        row_data jsonb;
        resolved_site_id uuid;
        resolved_tenant_id uuid;
        resolved_entity_id uuid;
        resolved_operation varchar(10);
      BEGIN
        -- Serializa las transacciones que producen cambios. Esto evita que una
        -- secuencia menor se confirme después de que un pull ya avanzó más allá.
        PERFORM pg_advisory_xact_lock(17991016);

        row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
        resolved_tenant_id := (row_data ->> 'tenant_id')::uuid;
        resolved_entity_id := (row_data ->> 'id')::uuid;
        resolved_operation := CASE TG_OP
          WHEN 'INSERT' THEN 'CREATE'
          WHEN 'UPDATE' THEN 'UPDATE'
          ELSE 'DELETE'
        END;

        IF TG_ARGV[1] = 'site' THEN
          resolved_site_id := COALESCE(
            (row_data ->> 'site_id')::uuid,
            resolved_entity_id
          );
        ELSIF TG_ARGV[1] = 'work' THEN
          SELECT "site_id" INTO resolved_site_id
          FROM "works"
          WHERE "id" = (row_data ->> 'work_id')::uuid
            AND "tenant_id" = resolved_tenant_id;

          IF resolved_site_id IS NULL THEN
            SELECT ("payload" ->> 'site_id')::uuid INTO resolved_site_id
            FROM "server_changes"
            WHERE "tenant_id" = resolved_tenant_id
              AND "entity_type" = 'WORK'
              AND "entity_id" = (row_data ->> 'work_id')::uuid
            ORDER BY "sequence" DESC
            LIMIT 1;
          END IF;
        ELSE
          resolved_site_id := NULL;
        END IF;

        INSERT INTO "server_changes" (
          "tenant_id", "site_id", "source_device_id", "entity_type", "entity_id",
          "operation", "payload", "changed_at"
        ) VALUES (
          resolved_tenant_id, resolved_site_id,
          NULLIF(current_setting('app.sync_device_id', true), '')::uuid,
          TG_ARGV[0], resolved_entity_id,
          resolved_operation, row_data, clock_timestamp()
        );
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
      END;
      $$ LANGUAGE plpgsql
    `);

    for (const [table, entityType, scope] of triggerDefinitions) {
      if (table === 'works') {
        await queryRunner.query(`
          CREATE TRIGGER "TR_server_changes_${table}_write"
          AFTER INSERT OR UPDATE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION record_server_change('${entityType}', '${scope}')
        `);
        await queryRunner.query(`
          CREATE TRIGGER "TR_server_changes_${table}_delete"
          BEFORE DELETE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION record_server_change('${entityType}', '${scope}')
        `);
      } else {
        await queryRunner.query(`
          CREATE TRIGGER "TR_server_changes_${table}"
          AFTER INSERT OR UPDATE OR DELETE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION record_server_change('${entityType}', '${scope}')
        `);
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table] of [...triggerDefinitions].reverse()) {
      if (table === 'works') {
        await queryRunner.query(
          `DROP TRIGGER IF EXISTS "TR_server_changes_${table}_delete" ON "${table}"`
        );
        await queryRunner.query(
          `DROP TRIGGER IF EXISTS "TR_server_changes_${table}_write" ON "${table}"`
        );
      } else {
        await queryRunner.query(
          `DROP TRIGGER IF EXISTS "TR_server_changes_${table}" ON "${table}"`
        );
      }
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS record_server_change()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "server_changes"`);
  }
}
