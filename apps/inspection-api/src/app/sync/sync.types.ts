import type { WorkStatus } from '../works/entities/work.entity';
import type { SyncPushChangeDto } from './dto/sync-push.dto';

export type WorkPayload = {
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
};

export type ResponsePayload = {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  conceptId: string;
  valueNumber?: number;
  valueText?: string;
  selectedOptionId?: string;
};

export type TaskPayload = {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  completed: boolean;
};

export type AnnotationPayload = {
  id: string;
  tenantId: string;
  workId: string;
  formItemId: string;
  comment: string;
};

export type ParsedPayload =
  | WorkPayload
  | ResponsePayload
  | TaskPayload
  | AnnotationPayload;

export type ParsedChange = SyncPushChangeDto & {
  workId: string;
  parsedPayload: ParsedPayload;
};
