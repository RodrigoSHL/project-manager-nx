import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export type AssetMutationPayload = {
  code?: string;
  name?: string;
  assetTypeId?: string;
  parentId?: string | null;
  status?: 'ACTIVE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  description?: string | null;
};

export type CatalogMutationPayload = {
  code?: string;
  name?: string;
  description?: string | null;
  active?: boolean;
};

export type TenantMutationPayload = {
  code?: string;
  name?: string;
  active?: boolean;
};

export type ConceptMutationPayload = {
  code?: string;
  name?: string;
  description?: string | null;
  type?: 'ANALOG' | 'DIGITAL' | 'TEXT' | 'HIDDEN';
  unit?: string | null;
  active?: boolean;
  options?: Array<{
    value: string;
    label: string;
    order: number;
    active?: boolean;
  }>;
};

export type FormTemplateMutationPayload = {
  name?: string;
  description?: string | null;
  active?: boolean;
};

export type FormSectionMutationPayload = {
  title?: string;
  description?: string | null;
};

export type FormItemMutationPayload = {
  type?: 'CONCEPT' | 'TASK';
  title?: string | null;
  description?: string | null;
  conceptId?: string | null;
  required?: boolean;
};

export type WorkMutationPayload = {
  workTypeId: string;
  title: string;
  executionDate: string;
  responsible: string;
  company?: string;
  status: 'DRAFT' | 'IN_PROGRESS';
  notes?: string;
};

export type WorkResponsesPayload = {
  responses: Array<{
    formItemId: string;
    valueNumber?: number;
    valueText?: string;
    selectedOptionId?: string;
  }>;
  taskCompletions: Array<{
    formItemId: string;
    completed: boolean;
  }>;
};

@Injectable()
export class InspectionApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

  listTenants() {
    return this.get('/tenants');
  }

  listPlatformTenants() {
    return this.get('/platform/tenants');
  }

  getPlatformTenant(tenantId: string) {
    return this.get(`/platform/tenants/${encodeURIComponent(tenantId)}`);
  }

  createPlatformTenant(payload: Required<TenantMutationPayload>) {
    return this.request('/platform/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updatePlatformTenant(tenantId: string, payload: TenantMutationPayload) {
    return this.request(`/platform/tenants/${encodeURIComponent(tenantId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  listWorks(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/works`);
  }

  getWork(tenantId: string, workId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}`
    );
  }

  createWork(
    tenantId: string,
    siteId: string,
    assetId: string,
    payload: WorkMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/works`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  saveWorkResponses(
    tenantId: string,
    workId: string,
    payload: WorkResponsesPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/responses`,
      { method: 'PUT', body: JSON.stringify(payload) }
    );
  }

  startWork(tenantId: string, workId: string) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: 'IN_PROGRESS' }) }
    );
  }

  finishWork(tenantId: string, workId: string, payload: WorkResponsesPayload) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/finish`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  listSites(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/sites`);
  }

  listAssetTypes(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/asset-types`);
  }

  createAssetType(tenantId: string, payload: Required<CatalogMutationPayload>) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/asset-types`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  updateAssetType(
    tenantId: string,
    assetTypeId: string,
    payload: CatalogMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(assetTypeId)}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  listAssetTypeWorkTypes(tenantId: string, assetTypeId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(assetTypeId)}/work-types`
    );
  }

  associateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/work-types/${encodeURIComponent(workTypeId)}`,
      { method: 'PUT' }
    );
  }

  disassociateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/work-types/${encodeURIComponent(workTypeId)}`,
      { method: 'DELETE' }
    );
  }

  listWorkTypes(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/work-types`);
  }

  createWorkType(tenantId: string, payload: Required<CatalogMutationPayload>) {
    return this.request(`/tenants/${encodeURIComponent(tenantId)}/work-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateWorkType(
    tenantId: string,
    workTypeId: string,
    payload: CatalogMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/work-types/${encodeURIComponent(
        workTypeId
      )}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  listFormTemplates(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/form-templates`);
  }

  createFormTemplate(
    tenantId: string,
    workTypeId: string,
    payload: FormTemplateMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/work-types/${encodeURIComponent(
        workTypeId
      )}/form-template`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  updateFormTemplate(
    tenantId: string,
    templateId: string,
    payload: FormTemplateMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  createFormSection(
    tenantId: string,
    templateId: string,
    payload: FormSectionMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}/sections`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  updateFormSection(
    tenantId: string,
    sectionId: string,
    payload: FormSectionMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  deleteFormSection(tenantId: string, sectionId: string) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}`,
      { method: 'DELETE' }
    );
  }

  reorderFormSections(
    tenantId: string,
    templateId: string,
    orderedIds: string[]
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}/section-order`,
      { method: 'PUT', body: JSON.stringify({ orderedIds }) }
    );
  }

  createFormItem(
    tenantId: string,
    sectionId: string,
    payload: FormItemMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}/items`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  updateFormItem(
    tenantId: string,
    itemId: string,
    payload: FormItemMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/form-items/${encodeURIComponent(
        itemId
      )}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  deleteFormItem(tenantId: string, itemId: string) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/form-items/${encodeURIComponent(
        itemId
      )}`,
      { method: 'DELETE' }
    );
  }

  reorderFormItems(tenantId: string, sectionId: string, orderedIds: string[]) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}/item-order`,
      { method: 'PUT', body: JSON.stringify({ orderedIds }) }
    );
  }

  listConcepts(tenantId: string) {
    return this.get(`/tenants/${encodeURIComponent(tenantId)}/concepts`);
  }

  createConcept(tenantId: string, payload: Required<ConceptMutationPayload>) {
    return this.request(`/tenants/${encodeURIComponent(tenantId)}/concepts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateConcept(
    tenantId: string,
    conceptId: string,
    payload: ConceptMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/concepts/${encodeURIComponent(
        conceptId
      )}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
  }

  listAssetTypeConcepts(tenantId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/asset-type-concepts`
    );
  }

  associateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/concepts/${encodeURIComponent(conceptId)}`,
      { method: 'PUT' }
    );
  }

  disassociateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/concepts/${encodeURIComponent(conceptId)}`,
      { method: 'DELETE' }
    );
  }

  listEffectiveConcepts(tenantId: string, siteId: string, assetId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/concepts`
    );
  }

  listAssets(tenantId: string, siteId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets`
    );
  }

  getAsset(tenantId: string, siteId: string, assetId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}`
    );
  }

  listEffectiveWorkTypes(tenantId: string, siteId: string, assetId: string) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/work-types`
    );
  }

  listAssetWorkTypeConfigurations(
    tenantId: string,
    siteId: string,
    assetId: string
  ) {
    return this.get(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/work-type-configurations`
    );
  }

  setAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string,
    enabled: boolean
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(
        assetId
      )}/work-type-configurations/${encodeURIComponent(workTypeId)}`,
      { method: 'PUT', body: JSON.stringify({ enabled }) }
    );
  }

  clearAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(
        assetId
      )}/work-type-configurations/${encodeURIComponent(workTypeId)}`,
      { method: 'DELETE' }
    );
  }

  createAsset(
    tenantId: string,
    siteId: string,
    payload: Required<AssetMutationPayload>
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  updateAsset(
    tenantId: string,
    siteId: string,
    assetId: string,
    payload: AssetMutationPayload
  ) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  }

  deleteAsset(tenantId: string, siteId: string, assetId: string) {
    return this.request(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}`,
      { method: 'DELETE' }
    );
  }

  private async get<T = unknown>(path: string): Promise<T> {
    return this.request(path);
  }

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    let response: Response;
    try {
      const requestInit = Object.keys(init).length
        ? {
            ...init,
            ...(init.body || init.headers
              ? {
                  headers: {
                    ...(init.body
                      ? { 'Content-Type': 'application/json' }
                      : {}),
                    ...init.headers,
                  },
                }
              : {}),
          }
        : undefined;
      response = requestInit
        ? await fetch(`${this.baseUrl}${path}`, requestInit)
        : await fetch(`${this.baseUrl}${path}`);
    } catch {
      throw new ServiceUnavailableException('Inspection API is unavailable');
    }

    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ message: 'Inspection API error' }));
      throw new HttpException(
        body,
        response.status >= 500 ? 502 : response.status
      );
    }

    return response.json() as Promise<T>;
  }

  private resolveBaseUrl() {
    const configuredUrl = (
      process.env.INSPECTION_API_URL || 'http://localhost:3005/api'
    ).replace(/\/$/, '');
    return configuredUrl.endsWith('/api')
      ? configuredUrl
      : `${configuredUrl}/api`;
  }
}
