import { useEffect, useMemo } from 'react';
import type { Concept } from '../concepts/models';
import type { WorkType } from '../work-types/models';
import { useFormTemplateCatalogStore } from './form-template-catalog-context';

export function useFormTemplateCatalog(
  tenantId: string,
  workTypes: WorkType[],
  concepts: Concept[]
) {
  const store = useFormTemplateCatalogStore();

  useEffect(() => {
    store.ensureTenant(tenantId, workTypes, concepts);
  }, [concepts, store.ensureTenant, tenantId, workTypes]);

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
    createTemplate: (
      workType: WorkType,
      input: Parameters<typeof store.createTemplate>[2]
    ) => store.createTemplate(tenantId, workType, input),
    updateTemplate: (
      templateId: string,
      input: Parameters<typeof store.updateTemplate>[2]
    ) => store.updateTemplate(tenantId, templateId, input),
    createSection: (
      templateId: string,
      input: Parameters<typeof store.createSection>[2]
    ) => store.createSection(tenantId, templateId, input),
    updateSection: (
      sectionId: string,
      input: Parameters<typeof store.updateSection>[2]
    ) => store.updateSection(tenantId, sectionId, input),
    deleteSection: (sectionId: string) =>
      store.deleteSection(tenantId, sectionId),
    moveSection: (templateId: string, sectionId: string, direction: -1 | 1) =>
      store.moveSection(tenantId, templateId, sectionId, direction),
    createItem: (
      sectionId: string,
      input: Parameters<typeof store.createItem>[2]
    ) => store.createItem(tenantId, sectionId, input, concepts),
    updateItem: (
      itemId: string,
      input: Parameters<typeof store.updateItem>[2]
    ) => store.updateItem(tenantId, itemId, input, concepts),
    deleteItem: (sectionId: string, itemId: string) =>
      store.deleteItem(tenantId, sectionId, itemId),
    moveItem: (sectionId: string, itemId: string, direction: -1 | 1) =>
      store.moveItem(tenantId, sectionId, itemId, direction),
  };
}
