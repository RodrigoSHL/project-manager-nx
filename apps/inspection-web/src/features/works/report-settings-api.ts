import { authenticatedFetch } from '../auth/authenticated-fetch';
import type { ReportOptions } from './work-report-api';

export type TenantReportSettings = {
  tenantId: string;
  defaults: ReportOptions;
  logoUrl: string | null;
};

const path = (tenantId: string) =>
  `/api/inspection/tenants/${encodeURIComponent(tenantId)}/report-settings`;

async function request(url: string, init?: RequestInit) {
  const response = await authenticatedFetch(url, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message || 'No se pudo guardar la configuración del informe.'
    );
  }
  return response.json() as Promise<TenantReportSettings>;
}

export const reportSettingsApi = {
  get: (tenantId: string) => request(path(tenantId)),
  saveDefaults: (tenantId: string, defaults: ReportOptions) =>
    request(path(tenantId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaults }),
    }),
  uploadLogo: (tenantId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request(`${path(tenantId)}/logo`, { method: 'POST', body: form });
  },
  removeLogo: (tenantId: string) =>
    request(`${path(tenantId)}/logo`, { method: 'DELETE' }),
};
