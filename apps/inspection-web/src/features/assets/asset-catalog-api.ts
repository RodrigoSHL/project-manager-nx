import type { AssetType } from '../asset-types/models';
import type { EffectiveWorkType, WorkType } from '../work-types/models';
import type { Asset, Site, Tenant } from './models';

export type AssetMutationInput = {
  code: string;
  name: string;
  assetTypeId: string;
  parentId: string | null;
  status: Asset['status'];
  description: string | null;
};

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { signal });

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

  listAssetTypes(tenantId: string, signal?: AbortSignal) {
    return get<AssetType[]>(
      `/tenants/${encodeURIComponent(tenantId)}/asset-types`,
      signal
    );
  },

  listWorkTypes(tenantId: string, signal?: AbortSignal) {
    return get<WorkType[]>(
      `/tenants/${encodeURIComponent(tenantId)}/work-types`,
      signal
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
  const response = await fetch(`${baseUrl}${path}`, {
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
