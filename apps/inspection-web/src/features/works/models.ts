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

export interface WorkConceptOptionSnapshot {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface WorkConceptSnapshot {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: ConceptType;
  unit?: string | null;
  options: WorkConceptOptionSnapshot[];
}

export interface WorkFormItemSnapshot {
  id: string;
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
  'valueNumber' | 'valueText' | 'selectedOptionId'
>;

export type WorkItemValue = ResponseValue & { completed?: boolean };

export type FinishResult =
  | { ok: true }
  | { ok: false; message: string; missingLabels: string[] };
