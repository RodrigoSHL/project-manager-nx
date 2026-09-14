import type { WorkRepository } from './work-repository';
import { loadWorkReferenceCatalog } from '../features/works/work-reference-loader';
import {
  toWorkResponsesPayload,
  workApi,
  WorkApiError,
} from '../features/works/work-api';
import type { WorkTemplateSnapshot } from '../features/works/models';

const snapshots = new Map<string, WorkTemplateSnapshot>();

export const remoteWorkRepository: WorkRepository = {
  source: 'REMOTE',
  async getById(tenantId, id) {
    return (await workApi.list(tenantId)).works.find(
      (item) => item.id === id && item.tenantId === tenantId
    );
  },
  async listBySite(tenantId, siteId) {
    return (await workApi.list(tenantId)).works.filter(
      (item) => item.tenantId === tenantId && item.siteId === siteId
    );
  },
  async listByAsset(tenantId, assetId) {
    return (await workApi.list(tenantId)).works.filter(
      (item) => item.tenantId === tenantId && item.assetId === assetId
    );
  },
  async loadTenant(tenantId) {
    const [catalog, data] = await Promise.all([
      loadWorkReferenceCatalog(tenantId),
      workApi.list(tenantId),
    ]);
    data.snapshots.forEach((snapshot) =>
      snapshots.set(key(tenantId, snapshot.workId), snapshot)
    );
    return { catalog, data };
  },
  async create(input) {
    const result = await workApi.create(input);
    snapshots.set(key(input.tenantId, result.work.id), result.snapshot);
    return result.work;
  },
  async saveResponses(tenantId, workId, values) {
    const snapshot = requireSnapshot(tenantId, workId);
    await workApi.saveResponses(
      tenantId,
      workId,
      toWorkResponsesPayload(snapshot, values)
    );
  },
  async start(tenantId, workId) {
    await workApi.start(tenantId, workId);
  },
  async finish(tenantId, workId, values) {
    try {
      const snapshot = requireSnapshot(tenantId, workId);
      await workApi.finish(
        tenantId,
        workId,
        toWorkResponsesPayload(snapshot, values)
      );
      return { ok: true };
    } catch (error) {
      if (error instanceof WorkApiError) {
        return {
          ok: false,
          message: error.message,
          missingLabels: error.missingLabels,
        };
      }
      throw error;
    }
  },
};

function key(tenantId: string, workId: string) {
  return `${tenantId}:${workId}`;
}

function requireSnapshot(tenantId: string, workId: string) {
  const snapshot = snapshots.get(key(tenantId, workId));
  if (!snapshot)
    throw new WorkApiError('No se encontró la plantilla del trabajo.');
  return snapshot;
}
