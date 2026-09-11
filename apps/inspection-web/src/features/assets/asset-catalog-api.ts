import type { AssetType } from '../asset-types/models';
import type {
  AssetTypeWorkTypeOption,
  AssetWorkTypeConfiguration,
  EffectiveWorkType,
  WorkType,
} from '../work-types/models';
import type { Asset, Site, Tenant } from './models';
import { authenticatedFetch } from '../auth/authenticated-fetch';

export type AssetMutationInput = {
  code: string;
  name: string;
  assetTypeId: string;
  parentId: string | null;
  status: Asset['status'];
  description: string | null;
};

export type CatalogMutationInput = {
  code: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type SiteMutationInput = {
  code: string;
  name: string;
  type: Site['type'];
  active: boolean;
};

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await authenticatedFetch(`${baseUrl}${path}`, { signal });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message || 'No fue posible cargar la información.';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const assetCatalogApi = {
  listTenants(signal?: AbortSignal) {
    return get<Tenant[]>('/tenants', signal);
  },

  listSites(tenantId: string, signal?: AbortSignal) {
    return get<Site[]>(
      `/tenants/${encodeURIComponent(tenantId)}/sites`,
      signal
    );
  },

  createSite(tenantId: string, input: SiteMutationInput) {
    return request<Site>(`/tenants/${encodeURIComponent(tenantId)}/sites`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateSite(
    tenantId: string,
    siteId: string,
    input: Partial<SiteMutationInput>
  ) {
    return request<Site>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },

  listAssetTypes(tenantId: string, signal?: AbortSignal) {
    return get<AssetType[]>(
      `/tenants/${encodeURIComponent(tenantId)}/asset-types`,
      signal
    );
  },

  createAssetType(tenantId: string, input: CatalogMutationInput) {
    return request<AssetType>(
      `/tenants/${encodeURIComponent(tenantId)}/asset-types`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },

  updateAssetType(
    tenantId: string,
    assetTypeId: string,
    input: Partial<CatalogMutationInput>
  ) {
    return request<AssetType>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(assetTypeId)}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },

  listAssetTypeWorkTypes(
    tenantId: string,
    assetTypeId: string,
    signal?: AbortSignal
  ) {
    return get<AssetTypeWorkTypeOption[]>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(assetTypeId)}/work-types`,
      signal
    );
  },

  associateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    return request<{ associated: true }>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/work-types/${encodeURIComponent(workTypeId)}`,
      { method: 'PUT' }
    );
  },

  disassociateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    return request<{ associated: false }>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/work-types/${encodeURIComponent(workTypeId)}`,
      { method: 'DELETE' }
    );
  },

  listWorkTypes(tenantId: string, signal?: AbortSignal) {
    return get<WorkType[]>(
      `/tenants/${encodeURIComponent(tenantId)}/work-types`,
      signal
    );
  },

  createWorkType(tenantId: string, input: CatalogMutationInput) {
    return request<WorkType>(
      `/tenants/${encodeURIComponent(tenantId)}/work-types`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },

  updateWorkType(
    tenantId: string,
    workTypeId: string,
    input: Partial<CatalogMutationInput>
  ) {
    return request<WorkType>(
      `/tenants/${encodeURIComponent(tenantId)}/work-types/${encodeURIComponent(
        workTypeId
      )}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },

  listAssets(tenantId: string, siteId: string, signal?: AbortSignal) {
    return get<Asset[]>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets`,
      signal
    );
  },

  listEffectiveWorkTypes(
    tenantId: string,
    siteId: string,
    assetId: string,
    signal?: AbortSignal
  ) {
    return get<EffectiveWorkType[]>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/work-types`,
      signal
    );
  },

  listAssetWorkTypeConfigurations(
    tenantId: string,
    siteId: string,
    assetId: string,
    signal?: AbortSignal
  ) {
    return get<AssetWorkTypeConfiguration[]>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/work-type-configurations`,
      signal
    );
  },

  setAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string,
    enabled: boolean
  ) {
    return request<{ override: boolean }>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(
        assetId
      )}/work-type-configurations/${encodeURIComponent(workTypeId)}`,
      { method: 'PUT', body: JSON.stringify({ enabled }) }
    );
  },

  clearAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string
  ) {
    return request<{ override: null }>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(
        assetId
      )}/work-type-configurations/${encodeURIComponent(workTypeId)}`,
      { method: 'DELETE' }
    );
  },

  createAsset(tenantId: string, siteId: string, input: AssetMutationInput) {
    return request<Asset>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  },

  updateAsset(
    tenantId: string,
    siteId: string,
    assetId: string,
    input: Partial<AssetMutationInput>
  ) {
    return request<Asset>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );
  },

  deleteAsset(tenantId: string, siteId: string, assetId: string) {
    return request<{ id: string; deleted: true }>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}`,
      { method: 'DELETE' }
    );
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message || 'No fue posible completar la operación.';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
