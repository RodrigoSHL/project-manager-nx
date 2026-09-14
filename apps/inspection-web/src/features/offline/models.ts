import type { Asset, Site, Tenant } from '../assets/models';
import type { AssetType } from '../asset-types/models';
import type {
  AssetTypeConcept,
  Concept,
  ConceptOption,
} from '../concepts/models';
import type {
  FormItem,
  FormSection,
  FormTemplate,
} from '../form-templates/models';
import type {
  ConceptResponse,
  TaskCompletion,
  Work,
  WorkItemAnnotation,
  WorkItemPhoto,
  WorkTemplateSnapshot,
} from '../works/models';
import type {
  AssetWorkTypeConfiguration,
  WorkType,
} from '../work-types/models';

export type LocalSyncStatus = 'SYNCED' | 'LOCAL_ONLY' | 'MODIFIED';
export type OfflineSiteStatus = 'DOWNLOADING' | 'READY' | 'ERROR';
export type DataSourceMode = 'REMOTE' | 'LOCAL';

export function resolveDataSourceMode(
  preferredMode: DataSourceMode,
  apiReachable: boolean
): DataSourceMode {
  return apiReachable ? preferredMode : 'LOCAL';
}

export type PendingChangeKind =
  | 'WORK'
  | 'RESPONSE'
  | 'TASK_COMPLETION'
  | 'ANNOTATION';

export interface PendingChangeItem {
  id: string;
  tenantId: string;
  workId: string;
  kind: PendingChangeKind;
  label: string;
  syncStatus: Exclude<LocalSyncStatus, 'SYNCED'>;
  updatedAt: string;
}

export interface PendingSyncSummary {
  total: number;
  localOnly: number;
  modified: number;
  newWorks: number;
  modifiedWorks: number;
  responses: number;
  taskCompletions: number;
  annotations: number;
  items: PendingChangeItem[];
}

export type LocalWork = Work & { syncStatus: LocalSyncStatus };
export type LocalConceptResponse = ConceptResponse & {
  syncStatus: LocalSyncStatus;
};
export type LocalTaskCompletion = TaskCompletion & {
  syncStatus: LocalSyncStatus;
};
export type LocalWorkItemAnnotation = WorkItemAnnotation & {
  syncStatus: LocalSyncStatus;
};

export interface OfflineSiteRecord {
  id: string;
  tenantId: string;
  siteId: string;
  status: OfflineSiteStatus;
  tenantName?: string;
  siteName?: string;
  downloadedAt?: string;
  error?: string;
}

export interface LocalFileReference {
  id: string;
  tenantId: string;
  workId: string;
  workItemId: string;
  remoteFileId?: string;
  localUrl?: string;
  mimeType: string;
  originalName: string;
  size: number;
  status: 'REMOTE_ONLY' | 'LOCAL_ONLY' | 'PENDING_UPLOAD';
}

export type LocalWorkTypeConfiguration = AssetWorkTypeConfiguration & {
  recordId: string;
  tenantId: string;
  assetId: string;
};

export interface OfflineCatalogBundle {
  tenant: Tenant;
  site: Site;
  assets: Asset[];
  assetTypes: AssetType[];
  workTypes: WorkType[];
  workTypeConfigurations: Array<
    AssetWorkTypeConfiguration & {
      recordId: string;
      tenantId: string;
      assetId: string;
    }
  >;
  concepts: Concept[];
  options: ConceptOption[];
  assetTypeConcepts: AssetTypeConcept[];
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
  works: Work[];
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  annotations: WorkItemAnnotation[];
  snapshots: WorkTemplateSnapshot[];
  photos: WorkItemPhoto[];
}
