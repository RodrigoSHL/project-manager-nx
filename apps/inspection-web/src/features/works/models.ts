import type { Asset, Site } from '../assets/models';
import type { ConceptType } from '../concepts/models';
import type { WorkType } from '../work-types/models';

export type WorkStatus = 'DRAFT' | 'IN_PROGRESS' | 'FINISHED' | 'REVIEWED';

export interface Work {
  id: string;
  tenantId: string;
  siteId: string;
  assetId: string;
  workTypeId: string;
  formTemplateId: string;
  formTemplateVersion: number;
  title: string;
  executionDate: string;
  responsible: string;
  company?: string;
  status: WorkStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConceptResponse {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  conceptId: string;
  valueNumber?: number;
  valueText?: string;
  selectedOptionId?: string;
  measuredAt?: string;
  measuredAtTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemAnnotation {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  comment: string;
  isFinding?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemPhoto {
  id: string;
  application: 'inspection-web';
  ownerType: 'work';
  ownerId: string;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: {
    category: 'work-item-photo';
    tenantId: string;
    formItemId: string;
    uploadedBy?: string;
    clientPhotoId?: string;
    capturedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkConceptOptionSnapshot {
  id: string;
  label: string;
  value: string;
  order: number;
  generatesFinding?: boolean;
  suggestedSeverityId?: string | null;
}

export interface WorkConceptSnapshot {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: ConceptType;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  outOfRangeSeverityId?: string | null;
  options: WorkConceptOptionSnapshot[];
}

export interface WorkFormItemSnapshot {
  id: string;
  /** Template item that originated this immutable work item instance. */
  formItemId?: string;
  /** Optional only for backwards compatibility with historical snapshots. */
  assetId?: string;
  assetCodeSnapshot?: string;
  assetNameSnapshot?: string;
  assetTypeIdSnapshot?: string;
  assetOrder?: number;
  assetDepth?: number;
  type: 'CONCEPT' | 'TASK';
  order: number;
  title?: string | null;
  description?: string | null;
  required: boolean;
  concept?: WorkConceptSnapshot;
}

export interface WorkFormSectionSnapshot {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  items: WorkFormItemSnapshot[];
}

export interface WorkTemplateSnapshot {
  workId: string;
  tenantId: string;
  formTemplateId: string;
  formTemplateVersion: number;
  name: string;
  sections: WorkFormSectionSnapshot[];
}

export type WorkReferenceCatalog = {
  tenantId: string;
  sites: Site[];
  assets: Asset[];
  workTypes: WorkType[];
};

export type CreateWorkInput = Pick<
  Work,
  | 'tenantId'
  | 'siteId'
  | 'assetId'
  | 'workTypeId'
  | 'title'
  | 'executionDate'
  | 'responsible'
  | 'company'
  | 'status'
  | 'notes'
>;

export type ResponseValue = Pick<
  ConceptResponse,
  | 'valueNumber'
  | 'valueText'
  | 'selectedOptionId'
  | 'measuredAt'
  | 'measuredAtTime'
>;

export type WorkItemValue = ResponseValue & {
  completed?: boolean;
  comment?: string;
  isFinding?: boolean;
};

export interface FindingCandidate {
  id: string;
  tenantId: string;
  workId: string;
  workItemId: string;
  assetId: string;
  conceptId?: string | null;
  source: 'DIGITAL' | 'ANALOG' | 'MANUAL';
  title: string;
  description?: string | null;
  measuredValue?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  suggestedSeverityId?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'DISCARDED';
  discardReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  tenantId: string;
  workId: string;
  workItemId: string;
  assetId: string;
  conceptId?: string | null;
  sourceCandidateId: string;
  source: FindingCandidate['source'];
  title: string;
  description?: string | null;
  measuredValue?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  severityId?: string | null;
  manHours?: number | null;
  materials?: string | null;
  assetNameSnapshot: string;
  conceptNameSnapshot?: string | null;
  unitSnapshot?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type FinishResult =
  | { ok: true }
  | { ok: false; message: string; missingLabels: string[] };
