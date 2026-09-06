import type { Asset, Site, Tenant } from './models';

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

  listAssets(tenantId: string, siteId: string, signal?: AbortSignal) {
    return get<Asset[]>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets`,
      signal
    );
  },
};
