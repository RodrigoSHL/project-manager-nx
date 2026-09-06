import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export type AssetMutationPayload = {
  code?: string;
  name?: string;
  type?: string;
  parentId?: string | null;
  status?: 'ACTIVE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  description?: string | null;
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
            headers: {
              ...(init.body ? { 'Content-Type': 'application/json' } : {}),
              ...init.headers,
            },
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
