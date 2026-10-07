import type { Transaction } from 'dexie';
import type {
  FormItem,
  FormSection,
  FormTemplate,
} from '../features/form-templates/models';
import type { OutboxItem } from '../features/offline/models';
import type { WorkTemplateSnapshot } from '../features/works/models';

const orderedCatalogEntities = new Set([
  'FORM_SECTION',
  'FORM_ITEM',
  'CONCEPT_OPTION',
  'SEVERITY_LEVEL',
]);

function validOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Pull records used sortOrder although these domain models use order. */
export function normalizeCatalogOrder<T extends object>(
  entityType: string,
  record: T
): T {
  if (!orderedCatalogEntities.has(entityType)) return record;
  const legacy = record as T & { order?: number; sortOrder?: number };
  if (!validOrder(legacy.sortOrder)) return record;
  const { sortOrder, ...fields } = legacy;
  return {
    ...fields,
    order: validOrder(legacy.order) ? legacy.order : sortOrder,
  } as T;
}

/** Restore missing positions only; never rebuild an existing work's template. */
export function repairSnapshotOrder(
  snapshot: WorkTemplateSnapshot,
  templates: FormTemplate[],
  sections: FormSection[],
  items: FormItem[]
): WorkTemplateSnapshot {
  const sameVersion = templates.some(
    (template) =>
      template.id === snapshot.formTemplateId &&
      template.tenantId === snapshot.tenantId &&
      template.version === snapshot.formTemplateVersion
  );
  let changed = false;
  const restore = <T extends { order: number }>(
    record: T,
    fallback?: number
  ): T => {
    const normalized = normalizeCatalogOrder('FORM_ITEM', record);
    if (normalized !== record) changed = true;
    if (validOrder(normalized.order) || !validOrder(fallback))
      return normalized;
    changed = true;
    return { ...normalized, order: fallback };
  };
  const repairedSections = snapshot.sections.map((section) => {
    const sourceSection = sameVersion
      ? sections.find(
          (source) =>
            source.id === section.id &&
            source.tenantId === snapshot.tenantId &&
            source.formTemplateId === snapshot.formTemplateId
        )
      : undefined;
    const repairedSection = restore(section, sourceSection?.order);
    const repairedItems = section.items.map((item) => {
      const sourceItem = sourceSection
        ? items.find(
            (source) =>
              source.id === item.formItemId &&
              source.tenantId === snapshot.tenantId &&
              source.sectionId === section.id
          )
        : undefined;
      const repairedItem = restore(item, sourceItem?.order);
      if (!item.concept) return repairedItem;
      const options = item.concept.options.map((option) => restore(option));
      return options.some(
        (option, index) => option !== item.concept?.options[index]
      )
        ? { ...repairedItem, concept: { ...item.concept, options } }
        : repairedItem;
    });
    return { ...repairedSection, items: repairedItems };
  });
  return changed ? { ...snapshot, sections: repairedSections } : snapshot;
}

export async function repairLocalFormOrder(transaction: Transaction) {
  for (const [tableName, entityType] of [
    ['formSections', 'FORM_SECTION'],
    ['formItems', 'FORM_ITEM'],
    ['conceptOptions', 'CONCEPT_OPTION'],
    ['severityLevels', 'SEVERITY_LEVEL'],
  ]) {
    await transaction
      .table(tableName)
      .toCollection()
      .modify((record) => {
        const normalized = normalizeCatalogOrder(entityType, record);
        if (normalized !== record) {
          Object.assign(record, normalized);
          delete record.sortOrder;
        }
      });
  }
  const templates = await transaction
    .table<FormTemplate>('formTemplates')
    .toArray();
  const sections = await transaction
    .table<FormSection>('formSections')
    .toArray();
  const items = await transaction.table<FormItem>('formItems').toArray();
  const snapshots = transaction.table<WorkTemplateSnapshot>('snapshots');
  for (const snapshot of await snapshots.toArray()) {
    const repaired = repairSnapshotOrder(snapshot, templates, sections, items);
    if (repaired !== snapshot) await snapshots.put(repaired);
  }
  // Pending CREATE payloads also contain the immutable snapshot sent to the API.
  const outbox = transaction.table<OutboxItem>('outbox');
  for (const entry of await outbox.toArray()) {
    if (
      entry.entityType !== 'WORK' ||
      entry.operation !== 'CREATE' ||
      !['PENDING', 'ERROR'].includes(entry.status)
    )
      continue;
    const snapshot = entry.payload.formSnapshot as
      | WorkTemplateSnapshot
      | undefined;
    if (
      !snapshot ||
      !Array.isArray(snapshot.sections) ||
      snapshot.tenantId !== entry.tenantId ||
      snapshot.workId !== entry.entityId
    )
      continue;
    const repaired = repairSnapshotOrder(snapshot, templates, sections, items);
    if (repaired !== snapshot)
      await outbox.put({
        ...entry,
        payload: { ...entry.payload, formSnapshot: repaired },
      });
  }
}
