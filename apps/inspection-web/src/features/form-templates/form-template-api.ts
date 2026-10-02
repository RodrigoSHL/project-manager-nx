import type {
  FormItem,
  FormItemInput,
  FormSection,
  FormSectionInput,
  FormTemplate,
  FormTemplateInput,
} from './models';
import { authenticatedFetch } from '../auth/authenticated-fetch';

export type FormTemplateCatalogResponse = {
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
};

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

export const formTemplateApi = {
  list(tenantId: string) {
    return request<FormTemplateCatalogResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/form-templates`
    );
  },
  createTemplate(
    tenantId: string,
    workTypeId: string,
    input: FormTemplateInput
  ) {
    return request<FormTemplate>(
      `/tenants/${encodeURIComponent(tenantId)}/work-types/${encodeURIComponent(
        workTypeId
      )}/form-template`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },
  updateTemplate(
    tenantId: string,
    templateId: string,
    input: FormTemplateInput
  ) {
    return request<FormTemplate>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },
  createSection(tenantId: string, templateId: string, input: FormSectionInput) {
    return request<FormSection>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}/sections`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },
  updateSection(tenantId: string, sectionId: string, input: FormSectionInput) {
    return request<FormSection>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },
  deleteSection(tenantId: string, sectionId: string) {
    return request<{ id: string; deleted: boolean }>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}`,
      { method: 'DELETE' }
    );
  },
  reorderSections(tenantId: string, templateId: string, orderedIds: string[]) {
    return request<FormSection[]>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-templates/${encodeURIComponent(templateId)}/section-order`,
      { method: 'PUT', body: JSON.stringify({ orderedIds }) }
    );
  },
  createItem(tenantId: string, sectionId: string, input: FormItemInput) {
    return request<FormItem>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}/items`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },
  updateItem(tenantId: string, itemId: string, input: FormItemInput) {
    return request<FormItem>(
      `/tenants/${encodeURIComponent(tenantId)}/form-items/${encodeURIComponent(
        itemId
      )}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    );
  },
  deleteItem(tenantId: string, itemId: string) {
    return request<{ id: string; deleted: boolean }>(
      `/tenants/${encodeURIComponent(tenantId)}/form-items/${encodeURIComponent(
        itemId
      )}`,
      { method: 'DELETE' }
    );
  },
  reorderItems(tenantId: string, sectionId: string, orderedIds: string[]) {
    return request<FormItem[]>(
      `/tenants/${encodeURIComponent(
        tenantId
      )}/form-sections/${encodeURIComponent(sectionId)}/item-order`,
      { method: 'PUT', body: JSON.stringify({ orderedIds }) }
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
      : body?.message || 'No fue posible guardar el formulario.';
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
