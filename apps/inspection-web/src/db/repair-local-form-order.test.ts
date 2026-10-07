import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectionDb } from './inspection-db';
import {
  normalizeCatalogOrder,
  repairSnapshotOrder,
} from './repair-local-form-order';
import type { WorkTemplateSnapshot } from '../features/works/models';
import type {
  FormItem,
  FormSection,
  FormTemplate,
} from '../features/form-templates/models';

const templates: FormTemplate[] = [
  {
    id: 'template',
    tenantId: 'tenant',
    workTypeId: 'visual',
    name: 'Visual',
    version: 1,
    active: true,
  },
];
const sections: FormSection[] = [
  {
    id: 'a-conclusion',
    tenantId: 'tenant',
    formTemplateId: 'template',
    title: 'Conclusión',
    order: 3,
  },
  {
    id: 'b-ventilation',
    tenantId: 'tenant',
    formTemplateId: 'template',
    title: 'Ventilación',
    order: 2,
  },
  {
    id: 'z-visual',
    tenantId: 'tenant',
    formTemplateId: 'template',
    title: 'Inspección Visual',
    order: 1,
  },
];
const items: FormItem[] = sections.map((section) => ({
  id: `item-${section.id}`,
  tenantId: 'tenant',
  sectionId: section.id,
  type: 'TASK',
  title: section.title,
  order: 1,
  required: true,
}));

function brokenSnapshot(): WorkTemplateSnapshot {
  return {
    workId: 'work',
    tenantId: 'tenant',
    formTemplateId: 'template',
    formTemplateVersion: 1,
    name: 'Visual',
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      items: [
        {
          id: `instance-${section.id}`,
          formItemId: `item-${section.id}`,
          type: 'TASK',
          required: true,
        },
      ],
    })),
  } as WorkTemplateSnapshot;
}

afterEach(async () => {
  await inspectionDb.delete();
});

describe('form order recovery', () => {
  it('upgrades legacy catalogs, broken snapshots and pending creates without losing work data', async () => {
    await inspectionDb.delete();
    const schema = Object.fromEntries(
      inspectionDb.tables.map((table) => [
        table.name,
        [
          table.schema.primKey.src,
          ...table.schema.indexes.map((index) => index.src),
        ].join(','),
      ])
    );
    const legacy = new Dexie('gridassets-inspection');
    legacy.version(6).stores(schema);
    await legacy.open();
    await legacy.table('formTemplates').bulkPut(templates);
    await legacy
      .table('formSections')
      .bulkPut(
        sections.map(({ order, ...section }) => ({
          ...section,
          sortOrder: order,
        }))
      );
    await legacy
      .table('formItems')
      .bulkPut(
        items.map(({ order, ...item }) => ({ ...item, sortOrder: order }))
      );
    await legacy.table('snapshots').put(brokenSnapshot());
    const work = {
      id: 'work',
      tenantId: 'tenant',
      status: 'IN_PROGRESS',
      syncStatus: 'LOCAL_ONLY',
    };
    const annotation = {
      id: 'annotation',
      tenantId: 'tenant',
      workId: 'work',
      formItemId: 'instance-a-conclusion',
      comment: 'todo ok',
      syncStatus: 'LOCAL_ONLY',
    };
    const pending = {
      id: 'pending',
      tenantId: 'tenant',
      entityType: 'WORK',
      entityId: 'work',
      operation: 'CREATE',
      payload: { ...work, formSnapshot: brokenSnapshot() },
      status: 'PENDING',
      attempts: 0,
      createdAt: '2026-10-05T12:00:00Z',
      updatedAt: '2026-10-05T12:00:00Z',
    };
    await legacy.table('works').put(work);
    await legacy.table('annotations').put(annotation);
    await legacy.table('outbox').put(pending);
    await legacy
      .table('fileBlobs')
      .put({ id: 'photo', blob: new Blob(['photo-bytes']) });
    legacy.close();
    await inspectionDb.open();
    expect(inspectionDb.verno).toBe(7);
    const snapshot = await inspectionDb.snapshots.get('work');
    expect(snapshot?.sections.map((section) => section.order)).toEqual([
      3, 2, 1,
    ]);
    expect(snapshot?.sections.map((section) => section.items[0].order)).toEqual(
      [1, 1, 1]
    );
    expect(snapshot?.sections.map((section) => section.items[0].id)).toEqual(
      brokenSnapshot().sections.map((section) => section.items[0].id)
    );
    const queued = await inspectionDb.outbox.get('pending');
    expect(
      (queued?.payload.formSnapshot as WorkTemplateSnapshot).sections.map(
        (section) => section.order
      )
    ).toEqual([3, 2, 1]);
    expect({ ...queued, payload: pending.payload }).toEqual(pending);
    expect(await inspectionDb.works.get('work')).toEqual(work);
    expect(await inspectionDb.annotations.get('annotation')).toEqual(
      annotation
    );
    expect((await inspectionDb.fileBlobs.get('photo'))?.blob.size).toBe(11);
    expect(await inspectionDb.formSections.get('a-conclusion')).toMatchObject({
      order: 3,
    });
  });

  it('preserves valid historical positions and refuses to infer from another version or tenant', () => {
    const snapshot = brokenSnapshot();
    snapshot.sections.forEach((section) => {
      section.order = 9;
      section.items[0].order = 8;
    });
    expect(repairSnapshotOrder(snapshot, templates, sections, items)).toBe(
      snapshot
    );
    const broken = brokenSnapshot();
    expect(
      repairSnapshotOrder(
        broken,
        [{ ...templates[0], version: 2 }],
        sections,
        items
      )
    ).toBe(broken);
    expect(
      repairSnapshotOrder(
        broken,
        [{ ...templates[0], tenantId: 'other' }],
        sections,
        items
      )
    ).toBe(broken);
  });

  it('only maps catalog aliases, retaining canonical orders and finding sortOrder', () => {
    expect(normalizeCatalogOrder('FORM_SECTION', { sortOrder: 3 })).toEqual({
      order: 3,
    });
    expect(
      normalizeCatalogOrder('FORM_ITEM', { order: 2, sortOrder: 3 })
    ).toEqual({ order: 2 });
    const finding = { sortOrder: 4 };
    expect(normalizeCatalogOrder('FINDING', finding)).toBe(finding);
  });
});
