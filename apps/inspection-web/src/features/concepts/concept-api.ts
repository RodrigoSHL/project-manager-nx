import type {
  AssetTypeConcept,
  Concept,
  ConceptFormValue,
  ConceptOption,
} from './models';
import { authenticatedFetch } from '../auth/authenticated-fetch';

export type ConceptWithOptions = Concept & { options: ConceptOption[] };

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

export const conceptApi = {
  listConcepts(tenantId: string, signal?: AbortSignal) {
    return request<ConceptWithOptions[]>(
      `/tenants/${encodeURIComponent(tenantId)}/concepts`,
      { signal }
    );
  },
  createConcept(tenantId: string, input: ConceptFormValue) {
    return request<ConceptWithOptions>(
      `/tenants/${encodeURIComponent(tenantId)}/concepts`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },
  updateConcept(
    tenantId: string,
    conceptId: string,
    input: Partial<ConceptFormValue>
  ) {
    return request<ConceptWithOptions>(
      `/tenants/${encodeURIComponent(tenantId)}/concepts/${encodeURIComponent(
        conceptId
      )}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },
  listAssetTypeConcepts(tenantId: string, signal?: AbortSignal) {
    return request<AssetTypeConcept[]>(
      `/tenants/${encodeURIComponent(tenantId)}/asset-type-concepts`,
      { signal }
    );
  },
  associateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    return request<AssetTypeConcept>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/concepts/${encodeURIComponent(conceptId)}`,
      { method: 'PUT' }
    );
  },
  disassociateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    return request<AssetTypeConcept & { associated: false }>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/asset-types/${encodeURIComponent(
        assetTypeId
      )}/concepts/${encodeURIComponent(conceptId)}`,
      { method: 'DELETE' }
    );
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await authenticatedFetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('No fue posible conectar con el servidor.');
  }

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
