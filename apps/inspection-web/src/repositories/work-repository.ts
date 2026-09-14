import type { WorkCatalogResponse } from '../features/works/work-api';
import type {
  CreateWorkInput,
  FinishResult,
  Work,
  WorkItemValue,
} from '../features/works/models';
import type { WorkReferenceData } from '../features/works/work-reference-loader';

export interface WorkRepository {
  readonly source: 'REMOTE' | 'LOCAL';
  getById(tenantId: string, id: string): Promise<Work | undefined>;
  listBySite(tenantId: string, siteId: string): Promise<Work[]>;
  listByAsset(tenantId: string, assetId: string): Promise<Work[]>;
  loadTenant(tenantId: string): Promise<{
    catalog: WorkReferenceData;
    data: WorkCatalogResponse;
  }>;
  create(input: CreateWorkInput): Promise<Work>;
  saveResponses(
    tenantId: string,
    workId: string,
    values: Record<string, WorkItemValue>
  ): Promise<void>;
  start(tenantId: string, workId: string): Promise<void>;
  finish(
    tenantId: string,
    workId: string,
    values: Record<string, WorkItemValue>
  ): Promise<FinishResult>;
}
