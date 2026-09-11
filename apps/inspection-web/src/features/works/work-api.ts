import type {
  ConceptResponse,
  CreateWorkInput,
  TaskCompletion,
  Work,
  WorkItemAnnotation,
  WorkItemValue,
  WorkTemplateSnapshot,
} from './models';
import { authenticatedFetch } from '../auth/authenticated-fetch';

export type WorkCatalogResponse = {
  works: Work[];
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  annotations: WorkItemAnnotation[];
  snapshots: WorkTemplateSnapshot[];
};

export type WorkResponsesPayload = {
  responses: Array<{
    formItemId: string;
    valueNumber?: number;
    valueText?: string;
    selectedOptionId?: string;
  }>;
  taskCompletions: Array<{ formItemId: string; completed: boolean }>;
  annotations: Array<{ formItemId: string; comment: string }>;
};

export class WorkApiError extends Error {
  constructor(message: string, readonly missingLabels: string[] = []) {
    super(message);
  }
}

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

export const workApi = {
  list(tenantId: string) {
    return request<WorkCatalogResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/works`
    );
  },

  create(input: CreateWorkInput) {
    const { tenantId, siteId, assetId, ...payload } = input;
    return request<{ work: Work; snapshot: WorkTemplateSnapshot }>(
      `/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(
        siteId
      )}/assets/${encodeURIComponent(assetId)}/works`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  saveResponses(
    tenantId: string,
    workId: string,
    payload: WorkResponsesPayload
  ) {
    return request(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/responses`,
      { method: 'PUT', body: JSON.stringify(payload) }
    );
  },

  start(tenantId: string, workId: string) {
    return request<Work>(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: 'IN_PROGRESS' }) }
    );
  },

  finish(tenantId: string, workId: string, payload: WorkResponsesPayload) {
    return request<Work>(
      `/tenants/${encodeURIComponent(tenantId)}/works/${encodeURIComponent(
        workId
      )}/finish`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },
};

export function toWorkResponsesPayload(
  snapshot: WorkTemplateSnapshot,
  values: Record<string, WorkItemValue>
): WorkResponsesPayload {
  const responses: WorkResponsesPayload['responses'] = [];
  const taskCompletions: WorkResponsesPayload['taskCompletions'] = [];
  const annotations: WorkResponsesPayload['annotations'] = [];
  for (const item of snapshot.sections.flatMap((section) => section.items)) {
    const value = values[item.id];
    if (value?.comment?.trim()) {
      annotations.push({
        formItemId: item.id,
        comment: value.comment.trim(),
      });
    }
    if (item.type === 'TASK') {
      if (value) {
        taskCompletions.push({
          formItemId: item.id,
          completed: value.completed === true,
        });
      }
      continue;
    }
    const concept = item.concept;
    if (!concept || !value) continue;
    if (concept.type === 'ANALOG' && Number.isFinite(value.valueNumber)) {
      responses.push({ formItemId: item.id, valueNumber: value.valueNumber });
    }
    if (concept.type === 'TEXT' && value.valueText?.trim()) {
      responses.push({
        formItemId: item.id,
        valueText: value.valueText.trim(),
      });
    }
    if (concept.type === 'DIGITAL' && value.selectedOptionId) {
      responses.push({
        formItemId: item.id,
        selectedOptionId: value.selectedOptionId,
      });
    }
  }
  return { responses, taskCompletions, annotations };
}

async function request<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
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
    throw new WorkApiError('No fue posible conectar con el servidor.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
      missingLabels?: string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message ?? 'No fue posible completar la operación.';
    throw new WorkApiError(message, body?.missingLabels ?? []);
  }
  return response.json() as Promise<T>;
}
