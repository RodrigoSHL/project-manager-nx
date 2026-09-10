import { useEffect, useMemo } from 'react';
import type { WorkType } from '../work-types/models';
import { useFormTemplateCatalogStore } from './form-template-catalog-context';
import type {
  FormItemInput,
  FormSectionInput,
  FormTemplateInput,
} from './models';

export function useFormTemplateCatalog(tenantId: string) {
  const store = useFormTemplateCatalogStore();

  useEffect(() => {
    void store.ensureTenant(tenantId);
  }, [store.ensureTenant, tenantId]);

  const templates = useMemo(
    () => store.templates.filter((item) => item.tenantId === tenantId),
    [store.templates, tenantId]
  );
  const sections = useMemo(
    () => store.sections.filter((item) => item.tenantId === tenantId),
    [store.sections, tenantId]
  );
  const items = useMemo(
    () => store.items.filter((item) => item.tenantId === tenantId),
    [store.items, tenantId]
  );

  return {
    templates,
    sections,
    items,
    error: store.errors[tenantId] ?? null,
    isLoading: store.loadingTenantIds.includes(tenantId),
    isMutating: store.mutatingTenantIds.includes(tenantId),
    retry: () => store.retryTenant(tenantId),
    createTemplate: (workType: WorkType, input: FormTemplateInput) =>
      store.createTemplate(tenantId, workType, input),
    updateTemplate: (templateId: string, input: FormTemplateInput) =>
      store.updateTemplate(tenantId, templateId, input),
    createSection: (templateId: string, input: FormSectionInput) =>
      store.createSection(tenantId, templateId, input),
    updateSection: (sectionId: string, input: FormSectionInput) =>
      store.updateSection(tenantId, sectionId, input),
    deleteSection: (sectionId: string) =>
      store.deleteSection(tenantId, sectionId),
    moveSection: (templateId: string, sectionId: string, direction: -1 | 1) =>
      store.moveSection(tenantId, templateId, sectionId, direction),
    createItem: (sectionId: string, input: FormItemInput) =>
      store.createItem(tenantId, sectionId, input),
    updateItem: (itemId: string, input: FormItemInput) =>
      store.updateItem(tenantId, itemId, input),
    deleteItem: (_sectionId: string, itemId: string) =>
      store.deleteItem(tenantId, itemId),
    moveItem: (sectionId: string, itemId: string, direction: -1 | 1) =>
      store.moveItem(tenantId, sectionId, itemId, direction),
  };
}
