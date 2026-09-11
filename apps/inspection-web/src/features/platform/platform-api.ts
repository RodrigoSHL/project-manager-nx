import { authenticatedFetch } from '../auth/authenticated-fetch';
import type { PlatformTenant, PlatformTenantUser } from './models';
import type { PlatformTenantFormValue } from './platform-schema';

export class PlatformApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export const platformTenantApi = {
  list(signal?: AbortSignal) {
    return request<PlatformTenant[]>('/api/platform/tenants', {
      signal,
    });
  },

  create(input: PlatformTenantFormValue) {
    return request<PlatformTenant>('/api/platform/tenants', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(tenantId: string, input: Partial<PlatformTenantFormValue>) {
    return request<PlatformTenant>(
      `/api/platform/tenants/${encodeURIComponent(tenantId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );
  },

  listUsers(tenantId: string, signal?: AbortSignal) {
    return request<PlatformTenantUser[]>(
      `/api/platform/tenants/${encodeURIComponent(tenantId)}/users`,
      { signal }
    );
  },

  setUserAccess(tenantId: string, userId: string, enabled: boolean) {
    return request(
      `/api/platform/tenants/${encodeURIComponent(
        tenantId
      )}/users/${encodeURIComponent(userId)}/access`,
      { method: enabled ? 'PUT' : 'DELETE' }
    );
  },
};

async function request<T = unknown>(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await authenticatedFetch(path, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new PlatformApiError('No fue posible conectar con el servidor.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message ?? 'No fue posible completar la operación.';
    throw new PlatformApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
