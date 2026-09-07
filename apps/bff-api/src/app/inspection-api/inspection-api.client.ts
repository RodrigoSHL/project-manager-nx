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

@Injectable()
export class InspectionApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

  listTenants() {
    return this.get('/tenants');
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
