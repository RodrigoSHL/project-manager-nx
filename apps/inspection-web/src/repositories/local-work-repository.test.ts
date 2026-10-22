import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { localWorkRepository } from './local-work-repository';
import { offlineRepository } from './offline-repository';
import { applyRemoteChanges } from '../services/apply-remote-changes';

const tenantId = 'tenant-a';
const siteId = 'site-a';
const assetId = 'asset-a';
const workTypeId = 'work-type-a';

describe('localWorkRepository', () => {
  beforeEach(async () => {
    await inspectionDb.delete();
    await inspectionDb.open();
    await inspectionDb.sites.add({
      id: siteId,
      tenantId,
      code: 'SITE-A',
      name: 'Mina A',
      type: 'MINE',
      active: true,
    });
    await inspectionDb.assets.add({
      id: assetId,
      tenantId,
      siteId,
      assetTypeId: 'asset-type-a',
      code: 'T1',
      name: 'Transformador T1',
      parentId: null,
      status: 'ACTIVE',
    });
    await inspectionDb.assetTypeConcepts.add({
      id: 'relation-root-temperature',
      tenantId,
      assetTypeId: 'asset-type-a',
      conceptId: 'concept-a',
      order: 1,
      active: true,
    });
    await inspectionDb.formTemplates.add({
      id: 'template-a',
      tenantId,
      workTypeId,
      name: 'Inspección visual',
      version: 1,
      active: true,
    });
    await inspectionDb.formSections.add({
      id: 'section-a',
      tenantId,
      formTemplateId: 'template-a',
      title: 'Condiciones generales',
      order: 1,
    });
    await inspectionDb.concepts.add({
      id: 'concept-a',
      tenantId,
      code: 'TEMPERATURE',
      name: 'Temperatura',
      type: 'ANALOG',
      unit: '°C',
      active: true,
    });
    await inspectionDb.formItems.add({
      id: 'item-a',
      tenantId,
      sectionId: 'section-a',
      type: 'CONCEPT',
      conceptId: 'concept-a',
      order: 1,
      required: true,
    });
  });

  afterEach(async () => inspectionDb.delete());

  it('creates offline works in template order after Pull sends legacy sortOrder aliases', async () => {
    const sectionRecords = [
      { id: 'a-conclusion', title: 'Conclusión', sortOrder: 3 },
      { id: 'b-ventilation', title: 'Ventilación', sortOrder: 2 },
      { id: 'z-visual', title: 'Inspección Visual', sortOrder: 1 },
    ];
    await inspectionDb.formSections.clear();
    await inspectionDb.formItems.clear();
    const changes = sectionRecords.flatMap((section, index) => [
      {
        sequence: index * 2 + 1,
        entityType: 'FORM_SECTION' as const,
        entityId: section.id,
        operation: 'CREATE' as const,
        payload: { ...section, tenantId, formTemplateId: 'template-a' },
        serverUpdatedAt: '2026-10-05T12:00:00Z',
      },
      {
        sequence: index * 2 + 2,
        entityType: 'FORM_ITEM' as const,
        entityId: `item-${section.id}`,
        operation: 'CREATE' as const,
        payload: {
          id: `item-${section.id}`,
          tenantId,
          sectionId: section.id,
          type: 'TASK',
          sortOrder: 1,
          required: true,
        },
        serverUpdatedAt: '2026-10-05T12:00:00Z',
      },
    ]);
    await applyRemoteChanges({
      tenantId,
      deviceId: 'device',
      currentCheckpoint: 0,
      response: { changes, checkpoint: 6, hasMore: false },
    });
    const work = await localWorkRepository.create({
      tenantId,
      siteId,
      assetId,
      workTypeId,
      title: 'Inspección visual nueva',
      executionDate: '2026-10-05',
      responsible: 'Inspector',
      status: 'DRAFT',
    });
    const snapshot = await inspectionDb.snapshots.get(work.id);
    expect(
      snapshot?.sections.map((section) => [section.title, section.order])
    ).toEqual([
      ['Inspección Visual', 1],
      ['Ventilación', 2],
      ['Conclusión', 3],
    ]);
    expect(snapshot?.sections.map((section) => section.items[0].order)).toEqual(
      [1, 1, 1]
    );
  });

  it('materializa el candidato offline sin agregarlo al outbox y lo elimina al normalizar', async () => {
    await inspectionDb.concepts.update('concept-a', {
      minValue: 0,
      maxValue: 40,
    });
    const work = await localWorkRepository.create({
      tenantId,
      siteId,
      assetId,
      workTypeId,
      title: 'Temperatura',
      executionDate: '2026-09-13',
      responsible: 'Inspector',
      status: 'DRAFT',
    });
    const snapshot = await inspectionDb.snapshots.get(work.id);
    const itemId = snapshot?.sections[0].items[0].id ?? '';
    await localWorkRepository.saveResponses(tenantId, work.id, {
      [itemId]: { valueNumber: 51 },
    });
    const first = await inspectionDb.findingCandidates
      .where('[tenantId+workId]')
      .equals([tenantId, work.id])
      .toArray();
    expect(first).toMatchObject([
      { source: 'ANALOG', measuredValue: '51 °C', status: 'PENDING' },
    ]);
    await localWorkRepository.saveResponses(tenantId, work.id, {
      [itemId]: { valueNumber: 52 },
    });
    const second = await inspectionDb.findingCandidates
      .where('[tenantId+workId]')
      .equals([tenantId, work.id])
      .toArray();
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe(first[0].id);
    expect(second[0].measuredValue).toBe('52 °C');
    expect(
      (await inspectionDb.outbox.toArray()).some(
        (item) => item.entityType === 'FINDING_CANDIDATE'
      )
    ).toBe(false);
    await localWorkRepository.saveResponses(tenantId, work.id, {
      [itemId]: { valueNumber: 35 },
    });
    expect(
      await inspectionDb.findingCandidates
        .where('[tenantId+workId]')
        .equals([tenantId, work.id])
        .count()
    ).toBe(0);
  });

  it('persiste un trabajo local, su respuesta y comentario sin cruzar tenants', async () => {
    const work = await localWorkRepository.create({
      tenantId,
      siteId,
      assetId,
      workTypeId,
      title: 'Inspección T1',
      executionDate: '2026-09-13',
      responsible: 'Inspector',
      status: 'DRAFT',
    });
    const snapshot = await inspectionDb.snapshots.get(work.id);
    const rootItem = snapshot?.sections
      .flatMap((section) => section.items)
      .find((item) => item.assetId === assetId);
    expect(rootItem).toBeDefined();

    await localWorkRepository.saveResponses(tenantId, work.id, {
      [rootItem?.id ?? 'missing']: {
        valueNumber: 42,
        measuredAt: '2026-09-12',
        measuredAtTime: '14:35',
        comment: 'Lectura estable',
      },
    });
    inspectionDb.close();
    await inspectionDb.open();

    const stored = await localWorkRepository.getById(tenantId, work.id);
    const foreign = await localWorkRepository.getById('tenant-b', work.id);
    const responses = await inspectionDb.conceptResponses
      .where('[tenantId+workId]')
      .equals([tenantId, work.id])
      .toArray();
    const annotations = await inspectionDb.annotations
      .where('[tenantId+workId]')
      .equals([tenantId, work.id])
      .toArray();

    expect(stored?.syncStatus).toBe('LOCAL_ONLY');
    expect(foreign).toBeUndefined();
    expect(responses[0]).toMatchObject({
      valueNumber: 42,
      measuredAt: '2026-09-12',
      measuredAtTime: '14:35',
      syncStatus: 'LOCAL_ONLY',
    });
    expect(annotations[0]).toMatchObject({
      comment: 'Lectura estable',
      syncStatus: 'LOCAL_ONLY',
    });
    const pending = await offlineRepository.getPendingSummary();
    expect(pending).toMatchObject({
      total: 3,
      localOnly: 3,
      newWorks: 1,
      responses: 1,
      annotations: 1,
    });
    expect(pending.items.find((item) => item.kind === 'RESPONSE')?.label).toBe(
      'Temperatura'
    );

    await inspectionDb.works.update(work.id, { syncStatus: 'SYNCED' });
    await inspectionDb.conceptResponses.update(responses[0].id, {
      syncStatus: 'SYNCED',
      measuredAtTime: '14:35:00',
    });
    await inspectionDb.annotations.update(annotations[0].id, {
      syncStatus: 'SYNCED',
    });
    await localWorkRepository.saveResponses(tenantId, work.id, {
      [rootItem?.id ?? 'missing']: {
        valueNumber: 43,
        comment: 'Lectura corregida',
      },
    });

    const modifiedWork = await localWorkRepository.getById(tenantId, work.id);
    const modifiedResponse = await inspectionDb.conceptResponses.get(
      responses[0].id
    );
    expect(modifiedWork?.syncStatus).toBe('MODIFIED');
    expect(modifiedResponse).toMatchObject({
      id: responses[0].id,
      valueNumber: 43,
      measuredAt: '2026-09-12',
      measuredAtTime: '14:35',
      syncStatus: 'MODIFIED',
    });
  });

  it('materializa solo conceptos permitidos para cada descendiente y conserva instancias repetidas', async () => {
    await inspectionDb.assets.bulkAdd([
      {
        id: 'radiator-r1',
        tenantId,
        siteId,
        assetTypeId: 'radiator-type',
        code: 'R1',
        name: 'Radiador R1',
        parentId: assetId,
        status: 'ACTIVE',
      },
      {
        id: 'radiator-r2',
        tenantId,
        siteId,
        assetTypeId: 'radiator-type',
        code: 'R2',
        name: 'Radiador R2',
        parentId: assetId,
        status: 'ACTIVE',
      },
      {
        id: 'fan-v1',
        tenantId,
        siteId,
        assetTypeId: 'fan-type',
        code: 'V1',
        name: 'Ventilador V1',
        parentId: 'radiator-r1',
        status: 'ACTIVE',
      },
      {
        id: 'bushing-b1',
        tenantId,
        siteId,
        assetTypeId: 'bushing-type',
        code: 'B1',
        name: 'Bushing B1',
        parentId: 'radiator-r1',
        status: 'ACTIVE',
      },
    ]);
    await inspectionDb.concepts.add({
      id: 'concept-current',
      tenantId,
      code: 'CURRENT',
      name: 'Corriente',
      type: 'ANALOG',
      unit: 'A',
      active: true,
    });
    await inspectionDb.assetTypeConcepts.bulkAdd([
      {
        id: 'relation-radiator-temperature',
        tenantId,
        assetTypeId: 'radiator-type',
        conceptId: 'concept-a',
        order: 1,
        active: true,
      },
      {
        id: 'relation-fan-current',
        tenantId,
        assetTypeId: 'fan-type',
        conceptId: 'concept-current',
        order: 1,
        active: true,
      },
      {
        id: 'relation-bushing-temperature',
        tenantId,
        assetTypeId: 'bushing-type',
        conceptId: 'concept-a',
        order: 1,
        active: true,
      },
    ]);
    await inspectionDb.formItems.add({
      id: 'task-a',
      tenantId,
      sectionId: 'section-a',
      type: 'TASK',
      title: 'Verificar acceso',
      order: 2,
      required: true,
    });

    const work = await localWorkRepository.create({
      tenantId,
      siteId,
      assetId,
      workTypeId,
      title: 'Inspección T1',
      executionDate: '2026-09-25',
      responsible: 'Inspector',
      status: 'DRAFT',
    });
    const snapshot = await inspectionDb.snapshots.get(work.id);
    const items = snapshot?.sections.flatMap((section) => section.items) ?? [];
    const workChange = await inspectionDb.outbox
      .where('[tenantId+entityType+entityId]')
      .equals([tenantId, 'WORK', work.id])
      .first();
    const temperatureItems = items.filter(
      (item) => item.concept?.id === 'concept-a'
    );

    expect(temperatureItems.map((item) => item.assetId)).toEqual([
      assetId,
      'radiator-r1',
      'bushing-b1',
      'radiator-r2',
    ]);
    expect(new Set(temperatureItems.map((item) => item.id)).size).toBe(4);
    expect(items.filter((item) => item.type === 'TASK')).toEqual([
      expect.objectContaining({ assetId, title: 'Verificar acceso' }),
    ]);
    expect(items.some((item) => item.assetId === 'fan-v1')).toBe(false);
    expect(workChange?.payload.formSnapshot).toEqual(snapshot);
  });
});
