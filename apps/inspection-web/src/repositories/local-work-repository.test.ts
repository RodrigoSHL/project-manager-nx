import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { localWorkRepository } from './local-work-repository';

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

    await localWorkRepository.saveResponses(tenantId, work.id, {
      'item-a': { valueNumber: 42, comment: 'Lectura estable' },
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
      syncStatus: 'LOCAL_ONLY',
    });
    expect(annotations[0]).toMatchObject({
      comment: 'Lectura estable',
      syncStatus: 'LOCAL_ONLY',
    });

    await inspectionDb.works.update(work.id, { syncStatus: 'SYNCED' });
    await inspectionDb.conceptResponses.update(responses[0].id, {
      syncStatus: 'SYNCED',
    });
    await inspectionDb.annotations.update(annotations[0].id, {
      syncStatus: 'SYNCED',
    });
    await localWorkRepository.saveResponses(tenantId, work.id, {
      'item-a': { valueNumber: 43, comment: 'Lectura corregida' },
    });

    const modifiedWork = await localWorkRepository.getById(tenantId, work.id);
    const modifiedResponse = await inspectionDb.conceptResponses.get(
      responses[0].id
    );
    expect(modifiedWork?.syncStatus).toBe('MODIFIED');
    expect(modifiedResponse).toMatchObject({
      id: responses[0].id,
      valueNumber: 43,
      syncStatus: 'MODIFIED',
    });
  });
});
