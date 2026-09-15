import { inspectionDb } from '../db/inspection-db';
import type { WorkRepository } from './work-repository';
import type { WorkCatalogResponse } from '../features/works/work-api';
import type {
  Work,
  WorkFormItemSnapshot,
  WorkItemValue,
  WorkTemplateSnapshot,
} from '../features/works/models';
import type { WorkReferenceData } from '../features/works/work-reference-loader';
import type { LocalSyncStatus } from '../features/offline/models';
import { enqueueOutboxChange } from './outbox-repository';

export const localWorkRepository: WorkRepository = {
  source: 'LOCAL',
  async getById(tenantId, id) {
    const work = await inspectionDb.works.get(id);
    return work?.tenantId === tenantId ? work : undefined;
  },
  listBySite(tenantId, siteId) {
    return inspectionDb.works
      .where('[tenantId+siteId]')
      .equals([tenantId, siteId])
      .toArray();
  },
  listByAsset(tenantId, assetId) {
    return inspectionDb.works
      .where('[tenantId+assetId]')
      .equals([tenantId, assetId])
      .toArray();
  },
  async loadTenant(tenantId) {
    const [
      sites,
      assets,
      workTypes,
      templates,
      sections,
      items,
      concepts,
      options,
    ] = await Promise.all([
      inspectionDb.sites.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.assets.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.workTypes.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.formTemplates.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.formSections.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.formItems.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.concepts.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.conceptOptions.where('tenantId').equals(tenantId).toArray(),
    ]);
    const catalog: WorkReferenceData = {
      tenantId,
      sites,
      assets,
      workTypes,
      templates,
      sections,
      items,
      concepts,
      options,
      workTypesByAssetType: {},
    };
    const data: WorkCatalogResponse = {
      works: await inspectionDb.works
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
      responses: await inspectionDb.conceptResponses
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
      taskCompletions: await inspectionDb.taskCompletions
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
      annotations: await inspectionDb.annotations
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
      snapshots: await inspectionDb.snapshots
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
    };
    return { catalog, data };
  },

  async create(input) {
    const [asset, site, template] = await Promise.all([
      inspectionDb.assets.get(input.assetId),
      inspectionDb.sites.get(input.siteId),
      inspectionDb.formTemplates
        .where('[tenantId+workTypeId]')
        .equals([input.tenantId, input.workTypeId])
        .filter((item) => item.active)
        .first(),
    ]);
    if (
      !asset ||
      !site ||
      asset.tenantId !== input.tenantId ||
      site.tenantId !== input.tenantId ||
      asset.siteId !== site.id
    ) {
      throw new Error('El activo o el sitio no pertenece a esta empresa.');
    }
    if (!template || template.tenantId !== input.tenantId) {
      throw new Error(
        'No existe una plantilla local activa para este trabajo.'
      );
    }
    const snapshot = await buildSnapshot(input.tenantId, template.id);
    const now = new Date().toISOString();
    const work: Work & { syncStatus: LocalSyncStatus } = {
      ...input,
      id: crypto.randomUUID(),
      formTemplateId: template.id,
      formTemplateVersion: template.version,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'LOCAL_ONLY',
    };
    snapshot.workId = work.id;
    await inspectionDb.transaction(
      'rw',
      inspectionDb.works,
      inspectionDb.snapshots,
      inspectionDb.outbox,
      async () => {
        await inspectionDb.works.add(work);
        await inspectionDb.snapshots.add(snapshot);
        await enqueueOutboxChange({
          tenantId: input.tenantId,
          entityType: 'WORK',
          entityId: work.id,
          operation: 'CREATE',
          payload: work,
          timestamp: now,
        });
      }
    );
    return work;
  },

  async saveResponses(tenantId, workId, values) {
    const [work, snapshot] = await Promise.all([
      requireWork(tenantId, workId),
      requireSnapshot(tenantId, workId),
    ]);
    const status = mutableStatus(work.syncStatus);
    const now = new Date().toISOString();
    await inspectionDb.transaction(
      'rw',
      inspectionDb.works,
      inspectionDb.conceptResponses,
      inspectionDb.taskCompletions,
      inspectionDb.annotations,
      inspectionDb.outbox,
      async () => {
        const oldResponses = await inspectionDb.conceptResponses
          .where('[tenantId+workId]')
          .equals([tenantId, workId])
          .toArray();
        const oldTasks = await inspectionDb.taskCompletions
          .where('[tenantId+workId]')
          .equals([tenantId, workId])
          .toArray();
        const oldAnnotations = await inspectionDb.annotations
          .where('[tenantId+workId]')
          .equals([tenantId, workId])
          .toArray();
        const responseByItem = new Map(
          oldResponses.map((item) => [item.formItemId, item])
        );
        const taskByItem = new Map(
          oldTasks.map((item) => [item.formItemId, item])
        );
        const annotationByItem = new Map(
          oldAnnotations.map((item) => [item.formItemId, item])
        );
        await Promise.all([
          inspectionDb.conceptResponses.bulkDelete(
            oldResponses.map((item) => item.id)
          ),
          inspectionDb.taskCompletions.bulkDelete(
            oldTasks.map((item) => item.id)
          ),
          inspectionDb.annotations.bulkDelete(
            oldAnnotations.map((item) => item.id)
          ),
        ]);
        const responseRecords = [];
        const taskRecords = [];
        const annotationRecords = [];
        for (const item of snapshot.sections.flatMap(
          (section) => section.items
        )) {
          const value = values[item.id];
          if (!value) continue;
          if (value.comment?.trim())
            annotationRecords.push({
              id: annotationByItem.get(item.id)?.id ?? crypto.randomUUID(),
              tenantId,
              workId,
              formItemId: item.id,
              comment: value.comment.trim(),
              createdAt: annotationByItem.get(item.id)?.createdAt ?? now,
              updatedAt: now,
              syncStatus: status,
            });
          if (item.type === 'TASK') {
            taskRecords.push({
              id: taskByItem.get(item.id)?.id ?? crypto.randomUUID(),
              tenantId,
              workId,
              formItemId: item.id,
              completed: value.completed === true,
              createdAt: taskByItem.get(item.id)?.createdAt ?? now,
              updatedAt: now,
              syncStatus: status,
            });
          } else if (hasResponse(value)) {
            responseRecords.push({
              id: responseByItem.get(item.id)?.id ?? crypto.randomUUID(),
              tenantId,
              workId,
              formItemId: item.id,
              conceptId: item.concept?.id ?? '',
              valueNumber: value.valueNumber,
              valueText: value.valueText?.trim() || undefined,
              selectedOptionId: value.selectedOptionId,
              createdAt: responseByItem.get(item.id)?.createdAt ?? now,
              updatedAt: now,
              syncStatus: status,
            });
          }
        }
        await inspectionDb.conceptResponses.bulkAdd(responseRecords);
        await inspectionDb.taskCompletions.bulkAdd(taskRecords);
        await inspectionDb.annotations.bulkAdd(annotationRecords);
        const updatedWork = {
          ...work,
          updatedAt: now,
          syncStatus: status,
        };
        await inspectionDb.works.put(updatedWork);
        await enqueueOutboxChange({
          tenantId,
          entityType: 'WORK',
          entityId: workId,
          operation: work.syncStatus === 'LOCAL_ONLY' ? 'CREATE' : 'UPDATE',
          payload: updatedWork,
          timestamp: now,
        });
        for (const record of responseRecords) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'RESPONSE',
            entityId: record.id,
            operation: responseByItem.has(record.formItemId)
              ? 'UPDATE'
              : 'CREATE',
            payload: record,
            timestamp: now,
          });
        }
        for (const record of taskRecords) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'TASK_COMPLETION',
            entityId: record.id,
            operation: taskByItem.has(record.formItemId) ? 'UPDATE' : 'CREATE',
            payload: record,
            timestamp: now,
          });
        }
        for (const record of annotationRecords) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'ANNOTATION',
            entityId: record.id,
            operation: annotationByItem.has(record.formItemId)
              ? 'UPDATE'
              : 'CREATE',
            payload: record,
            timestamp: now,
          });
        }
        const currentResponseIds = new Set(responseRecords.map(({ id }) => id));
        const currentTaskIds = new Set(taskRecords.map(({ id }) => id));
        const currentAnnotationIds = new Set(
          annotationRecords.map(({ id }) => id)
        );
        for (const record of oldResponses.filter(
          ({ id }) => !currentResponseIds.has(id)
        )) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'RESPONSE',
            entityId: record.id,
            operation: 'DELETE',
            payload: record,
            timestamp: now,
          });
        }
        for (const record of oldTasks.filter(
          ({ id }) => !currentTaskIds.has(id)
        )) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'TASK_COMPLETION',
            entityId: record.id,
            operation: 'DELETE',
            payload: record,
            timestamp: now,
          });
        }
        for (const record of oldAnnotations.filter(
          ({ id }) => !currentAnnotationIds.has(id)
        )) {
          await enqueueOutboxChange({
            tenantId,
            entityType: 'ANNOTATION',
            entityId: record.id,
            operation: 'DELETE',
            payload: record,
            timestamp: now,
          });
        }
      }
    );
  },

  async start(tenantId, workId) {
    const work = await requireWork(tenantId, workId);
    const now = new Date().toISOString();
    const updatedWork = {
      ...work,
      status: 'IN_PROGRESS',
      updatedAt: now,
      syncStatus: mutableStatus(work.syncStatus),
    } as const;
    await inspectionDb.transaction(
      'rw',
      inspectionDb.works,
      inspectionDb.outbox,
      async () => {
        await inspectionDb.works.put(updatedWork);
        await enqueueOutboxChange({
          tenantId,
          entityType: 'WORK',
          entityId: workId,
          operation: work.syncStatus === 'LOCAL_ONLY' ? 'CREATE' : 'UPDATE',
          payload: updatedWork,
          timestamp: now,
        });
      }
    );
  },

  async finish(tenantId, workId, values) {
    const snapshot = await requireSnapshot(tenantId, workId);
    const missingLabels = snapshot.sections.flatMap((section) =>
      section.items
        .filter((item) => item.required && !isAnswered(item, values[item.id]))
        .map((item) => item.title || item.concept?.name || 'Campo requerido')
    );
    if (missingLabels.length) {
      return {
        ok: false,
        message: 'Completa los campos obligatorios antes de finalizar.',
        missingLabels,
      };
    }
    await this.saveResponses(tenantId, workId, values);
    const work = await requireWork(tenantId, workId);
    const now = new Date().toISOString();
    const updatedWork = {
      ...work,
      status: 'FINISHED',
      updatedAt: now,
      syncStatus: mutableStatus(work.syncStatus),
    } as const;
    await inspectionDb.transaction(
      'rw',
      inspectionDb.works,
      inspectionDb.outbox,
      async () => {
        await inspectionDb.works.put(updatedWork);
        await enqueueOutboxChange({
          tenantId,
          entityType: 'WORK',
          entityId: workId,
          operation: work.syncStatus === 'LOCAL_ONLY' ? 'CREATE' : 'UPDATE',
          payload: updatedWork,
          timestamp: now,
        });
      }
    );
    return { ok: true };
  },
};

async function requireWork(tenantId: string, workId: string) {
  const work = await inspectionDb.works.get(workId);
  if (!work || work.tenantId !== tenantId)
    throw new Error('El trabajo no pertenece a esta empresa.');
  return work;
}

async function requireSnapshot(tenantId: string, workId: string) {
  const snapshot = await inspectionDb.snapshots.get(workId);
  if (!snapshot || snapshot.tenantId !== tenantId)
    throw new Error('No se encontró la plantilla local del trabajo.');
  return snapshot;
}

function mutableStatus(status: LocalSyncStatus): LocalSyncStatus {
  return status === 'LOCAL_ONLY' ? 'LOCAL_ONLY' : 'MODIFIED';
}

function hasResponse(value: WorkItemValue) {
  return (
    Number.isFinite(value.valueNumber) ||
    Boolean(value.valueText?.trim()) ||
    Boolean(value.selectedOptionId)
  );
}

function isAnswered(item: WorkFormItemSnapshot, value?: WorkItemValue) {
  if (!value) return false;
  if (item.type === 'TASK') return value.completed === true;
  if (item.concept?.type === 'ANALOG')
    return Number.isFinite(value.valueNumber);
  if (item.concept?.type === 'TEXT') return Boolean(value.valueText?.trim());
  if (item.concept?.type === 'DIGITAL') return Boolean(value.selectedOptionId);
  return true;
}

async function buildSnapshot(
  tenantId: string,
  templateId: string
): Promise<WorkTemplateSnapshot> {
  const template = await inspectionDb.formTemplates.get(templateId);
  if (!template || template.tenantId !== tenantId)
    throw new Error('Plantilla local inválida.');
  const sections = await inspectionDb.formSections
    .where('[tenantId+formTemplateId]')
    .equals([tenantId, templateId])
    .sortBy('order');
  return {
    workId: '',
    tenantId,
    formTemplateId: template.id,
    formTemplateVersion: template.version,
    name: template.name,
    sections: await Promise.all(
      sections.map(async (section) => {
        const items = await inspectionDb.formItems
          .where('[tenantId+sectionId]')
          .equals([tenantId, section.id])
          .sortBy('order');
        return {
          id: section.id,
          title: section.title,
          description: section.description,
          order: section.order,
          items: await Promise.all(
            items.map(async (item) => {
              if (item.type === 'TASK')
                return {
                  id: item.id,
                  type: item.type,
                  order: item.order,
                  title: item.title,
                  description: item.description,
                  required: item.required,
                };
              const concept = item.conceptId
                ? await inspectionDb.concepts.get(item.conceptId)
                : undefined;
              if (!concept || concept.tenantId !== tenantId)
                throw new Error(
                  'La plantilla contiene un concepto local inválido.'
                );
              const options = await inspectionDb.conceptOptions
                .where('[tenantId+conceptId]')
                .equals([tenantId, concept.id])
                .sortBy('order');
              return {
                id: item.id,
                type: item.type,
                order: item.order,
                title: item.title,
                description: item.description,
                required: item.required,
                concept: {
                  id: concept.id,
                  code: concept.code,
                  name: concept.name,
                  description: concept.description,
                  type: concept.type,
                  unit: concept.unit,
                  options: options.map(({ id, label, value, order }) => ({
                    id,
                    label,
                    value,
                    order,
                  })),
                },
              };
            })
          ),
        };
      })
    ),
  };
}
