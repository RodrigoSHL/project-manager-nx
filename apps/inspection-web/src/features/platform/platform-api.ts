import type { PlatformSession, PlatformTenant, PlatformUser } from './models';
import type { PlatformTenantFormValue } from './platform-schema';

export class PlatformApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export const platformAuthApi = {
  login(email: string, password: string) {
    return request<{ access_token: string; user: PlatformUser }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ).then(
      ({ access_token, user }) =>
        ({
          accessToken: access_token,
          user,
        } satisfies PlatformSession)
    );
  },
};

export const platformTenantApi = {
  list(accessToken: string, signal?: AbortSignal) {
    return request<PlatformTenant[]>('/api/platform/tenants', {
      accessToken,
      signal,
    });
  },

  create(accessToken: string, input: PlatformTenantFormValue) {
    return request<PlatformTenant>('/api/platform/tenants', {
      accessToken,
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(
    accessToken: string,
    tenantId: string,
    input: Partial<PlatformTenantFormValue>
  ) {
    return request<PlatformTenant>(
      `/api/platform/tenants/${encodeURIComponent(tenantId)}`,
      {
        accessToken,
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );
  },
};

type PlatformRequestInit = RequestInit & { accessToken?: string };

async function request<T>(path: string, init: PlatformRequestInit = {}) {
  const { accessToken, ...requestInit } = init;
  let response: Response;
  try {
    response = await fetch(path, {
      ...requestInit,
      headers: {
        ...(requestInit.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...requestInit.headers,
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
