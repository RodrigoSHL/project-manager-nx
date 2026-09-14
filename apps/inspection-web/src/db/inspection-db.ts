import Dexie, { type EntityTable } from 'dexie';
import type { Asset, Site, Tenant } from '../features/assets/models';
import type { AssetType } from '../features/asset-types/models';
import type {
  AssetTypeConcept,
  Concept,
  ConceptOption,
} from '../features/concepts/models';
import type {
  FormItem,
  FormSection,
  FormTemplate,
} from '../features/form-templates/models';
import type {
  LocalConceptResponse,
  LocalFileReference,
  LocalTaskCompletion,
  LocalWork,
  LocalWorkItemAnnotation,
  LocalWorkTypeConfiguration,
  OfflineSiteRecord,
} from '../features/offline/models';
import type { WorkTemplateSnapshot } from '../features/works/models';
import type { WorkType } from '../features/work-types/models';

export class InspectionDatabase extends Dexie {
  tenants!: EntityTable<Tenant, 'id'>;
  sites!: EntityTable<Site, 'id'>;
  assets!: EntityTable<Asset, 'id'>;
  assetTypes!: EntityTable<AssetType, 'id'>;
  workTypes!: EntityTable<WorkType, 'id'>;
  workTypeConfigurations!: EntityTable<LocalWorkTypeConfiguration, 'recordId'>;
  concepts!: EntityTable<Concept, 'id'>;
  conceptOptions!: EntityTable<ConceptOption, 'id'>;
  assetTypeConcepts!: EntityTable<AssetTypeConcept, 'id'>;
  formTemplates!: EntityTable<FormTemplate, 'id'>;
  formSections!: EntityTable<FormSection, 'id'>;
  formItems!: EntityTable<FormItem, 'id'>;
  works!: EntityTable<LocalWork, 'id'>;
  conceptResponses!: EntityTable<LocalConceptResponse, 'id'>;
  taskCompletions!: EntityTable<LocalTaskCompletion, 'id'>;
  annotations!: EntityTable<LocalWorkItemAnnotation, 'id'>;
  snapshots!: EntityTable<WorkTemplateSnapshot, 'workId'>;
  fileReferences!: EntityTable<LocalFileReference, 'id'>;
  offlineSites!: EntityTable<OfflineSiteRecord, 'id'>;

  constructor() {
    super('gridassets-inspection');
    this.version(1).stores({
      tenants: 'id, name',
      sites: 'id, tenantId, [tenantId+id], [tenantId+active]',
      assets:
        'id, tenantId, [tenantId+id], [tenantId+siteId], [tenantId+assetTypeId], [tenantId+parentId]',
      assetTypes: 'id, tenantId, [tenantId+id], [tenantId+active]',
      workTypes: 'id, tenantId, [tenantId+id], [tenantId+active]',
      workTypeConfigurations:
        'recordId, tenantId, [tenantId+assetId], [tenantId+id]',
      concepts: 'id, tenantId, [tenantId+id], [tenantId+active]',
      conceptOptions: 'id, tenantId, [tenantId+conceptId]',
      assetTypeConcepts:
        'id, tenantId, [tenantId+assetTypeId], [tenantId+conceptId]',
      formTemplates:
        'id, tenantId, [tenantId+id], [tenantId+workTypeId], [tenantId+active]',
      formSections: 'id, tenantId, [tenantId+formTemplateId]',
      formItems: 'id, tenantId, [tenantId+sectionId], [tenantId+conceptId]',
      works:
        'id, tenantId, [tenantId+id], [tenantId+siteId], [tenantId+assetId], [tenantId+syncStatus]',
      conceptResponses:
        'id, tenantId, [tenantId+workId], [tenantId+syncStatus]',
      taskCompletions: 'id, tenantId, [tenantId+workId], [tenantId+syncStatus]',
      annotations: 'id, tenantId, [tenantId+workId], [tenantId+syncStatus]',
      snapshots: 'workId, tenantId, [tenantId+workId]',
      fileReferences: 'id, tenantId, [tenantId+workId], [tenantId+status]',
      offlineSites: 'id, tenantId, [tenantId+siteId], [tenantId+status]',
    });
  }
}

export const inspectionDb = new InspectionDatabase();

export function offlineSiteKey(tenantId: string, siteId: string) {
  return `${tenantId}:${siteId}`;
}
