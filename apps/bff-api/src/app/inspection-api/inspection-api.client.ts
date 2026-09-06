import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

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

  private async get<T = unknown>(path: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`);
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
