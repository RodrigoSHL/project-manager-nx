import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Concept } from '../concepts/models';
import type { WorkType } from '../work-types/models';
import { createFormTemplateSeed } from './mock-form-templates';
import type {
  FormItem,
  FormItemInput,
  FormSection,
  FormSectionInput,
  FormTemplate,
  FormTemplateInput,
} from './models';

type FormTemplateCatalogState = {
  seededTenantIds: string[];
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
};

type FormTemplateCatalogValue = FormTemplateCatalogState & {
  ensureTenant: (
    tenantId: string,
    workTypes: WorkType[],
    concepts: Concept[]
  ) => void;
  createTemplate: (
    tenantId: string,
    workType: WorkType,
    input: FormTemplateInput
  ) => FormTemplate;
  updateTemplate: (
    tenantId: string,
    templateId: string,
    input: FormTemplateInput
  ) => FormTemplate;
  createSection: (
    tenantId: string,
    templateId: string,
    input: FormSectionInput
  ) => FormSection;
  updateSection: (
    tenantId: string,
    sectionId: string,
    input: FormSectionInput
  ) => FormSection;
  deleteSection: (tenantId: string, sectionId: string) => void;
  moveSection: (
    tenantId: string,
    templateId: string,
    sectionId: string,
    direction: -1 | 1
  ) => void;
  createItem: (
    tenantId: string,
    sectionId: string,
    input: FormItemInput,
    concepts: Concept[]
  ) => FormItem;
  updateItem: (
    tenantId: string,
    itemId: string,
    input: FormItemInput,
    concepts: Concept[]
  ) => FormItem;
  deleteItem: (tenantId: string, sectionId: string, itemId: string) => void;
  moveItem: (
    tenantId: string,
    sectionId: string,
    itemId: string,
    direction: -1 | 1
  ) => void;
};

const emptyState: FormTemplateCatalogState = {
  seededTenantIds: [],
  templates: [],
  sections: [],
  items: [],
};

const FormTemplateCatalogContext =
  createContext<FormTemplateCatalogValue | null>(null);

export function FormTemplateCatalogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<FormTemplateCatalogState>(emptyState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const ensureTenant = useCallback(
    (tenantId: string, workTypes: WorkType[], concepts: Concept[]) => {
      if (!tenantId || workTypes.length === 0 || concepts.length === 0) return;
      setState((current) => {
        if (current.seededTenantIds.includes(tenantId)) return current;
        const seed = createFormTemplateSeed(tenantId, workTypes, concepts);
        return {
          seededTenantIds: [...current.seededTenantIds, tenantId],
          templates: [...current.templates, ...seed.templates],
          sections: [...current.sections, ...seed.sections],
          items: [...current.items, ...seed.items],
        };
      });
    },
    []
  );

  const createTemplate = useCallback(
    (tenantId: string, workType: WorkType, input: FormTemplateInput) => {
      if (workType.tenantId !== tenantId) {
        throw new Error('El tipo de trabajo pertenece a otra empresa.');
      }
      if (
        stateRef.current.templates.some(
          (item) =>
            item.tenantId === tenantId && item.workTypeId === workType.id
        )
      ) {
        throw new Error(
          'Este tipo de trabajo ya tiene una plantilla configurada.'
        );
      }
      const template: FormTemplate = {
        id: crypto.randomUUID(),
        tenantId,
        workTypeId: workType.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        version: 1,
        active: input.active,
      };
      setState((current) => ({
        ...current,
        templates: [...current.templates, template],
      }));
      return template;
    },
    []
  );

  const updateTemplate = useCallback(
    (tenantId: string, templateId: string, input: FormTemplateInput) => {
      const existing = stateRef.current.templates.find(
        (template) =>
          template.id === templateId && template.tenantId === tenantId
      );
      if (!existing) throw new Error('La plantilla pertenece a otra empresa.');
      const updated: FormTemplate = {
        ...existing,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        active: input.active,
      };
      setState((current) => ({
        ...current,
        templates: current.templates.map((template) =>
          template.id === templateId && template.tenantId === tenantId
            ? updated
            : template
        ),
      }));
      return updated;
    },
    []
  );

  const createSection = useCallback(
    (tenantId: string, templateId: string, input: FormSectionInput) => {
      assertTemplate(stateRef.current.templates, tenantId, templateId);
      const section: FormSection = {
        id: crypto.randomUUID(),
        tenantId,
        formTemplateId: templateId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        order:
          stateRef.current.sections.filter(
            (item) =>
              item.tenantId === tenantId && item.formTemplateId === templateId
          ).length + 1,
      };
      setState((current) => ({
        ...current,
        sections: [...current.sections, section],
      }));
      return section;
    },
    []
  );

  const updateSection = useCallback(
    (tenantId: string, sectionId: string, input: FormSectionInput) => {
      const existing = stateRef.current.sections.find(
        (section) => section.id === sectionId && section.tenantId === tenantId
      );
      if (!existing) throw new Error('La sección pertenece a otra empresa.');
      const updated: FormSection = {
        ...existing,
        title: input.title.trim(),
        description: input.description?.trim() || null,
      };
      setState((current) => ({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId && section.tenantId === tenantId
            ? updated
            : section
        ),
      }));
      return updated;
    },
    []
  );

  const deleteSection = useCallback((tenantId: string, sectionId: string) => {
    const existing = stateRef.current.sections.find(
      (item) => item.id === sectionId && item.tenantId === tenantId
    );
    if (!existing) throw new Error('La sección pertenece a otra empresa.');
    setState((current) => {
      const remainingSections = current.sections.filter(
        (item) => item.id !== sectionId
      );
      return {
        ...current,
        sections: normalizeSectionOrders(
          remainingSections,
          tenantId,
          existing.formTemplateId
        ),
        items: current.items.filter(
          (item) => item.sectionId !== sectionId || item.tenantId !== tenantId
        ),
      };
    });
  }, []);

  const moveSection = useCallback(
    (
      tenantId: string,
      templateId: string,
      sectionId: string,
      direction: -1 | 1
    ) => {
      setState((current) => ({
        ...current,
        sections: moveOrdered(
          current.sections,
          (item) =>
            item.tenantId === tenantId && item.formTemplateId === templateId,
          sectionId,
          direction
        ),
      }));
    },
    []
  );

  const createItem = useCallback(
    (
      tenantId: string,
      sectionId: string,
      input: FormItemInput,
      concepts: Concept[]
    ) => {
      assertConceptInput(tenantId, input, concepts);
      assertSection(stateRef.current.sections, tenantId, sectionId);
      const item: FormItem = {
        id: crypto.randomUUID(),
        tenantId,
        sectionId,
        type: input.type,
        order:
          stateRef.current.items.filter(
            (candidate) =>
              candidate.tenantId === tenantId &&
              candidate.sectionId === sectionId
          ).length + 1,
        title: input.type === 'TASK' ? input.title?.trim() || null : null,
        description: input.description?.trim() || null,
        conceptId: input.type === 'CONCEPT' ? input.conceptId : null,
        required: input.required,
      };
      setState((current) => ({
        ...current,
        items: [...current.items, item],
      }));
      return item;
    },
    []
  );

  const updateItem = useCallback(
    (
      tenantId: string,
      itemId: string,
      input: FormItemInput,
      concepts: Concept[]
    ) => {
      assertConceptInput(tenantId, input, concepts);
      const existing = stateRef.current.items.find(
        (item) => item.id === itemId && item.tenantId === tenantId
      );
      if (!existing) throw new Error('El elemento pertenece a otra empresa.');
      const updated: FormItem = {
        ...existing,
        type: input.type,
        title: input.type === 'TASK' ? input.title?.trim() || null : null,
        description: input.description?.trim() || null,
        conceptId: input.type === 'CONCEPT' ? input.conceptId : null,
        required: input.required,
      };
      setState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === itemId && item.tenantId === tenantId ? updated : item
        ),
      }));
      return updated;
    },
    []
  );

  const deleteItem = useCallback(
    (tenantId: string, sectionId: string, itemId: string) => {
      const exists = stateRef.current.items.some(
        (item) => item.id === itemId && item.tenantId === tenantId
      );
      if (!exists) throw new Error('El elemento pertenece a otra empresa.');
      setState((current) => {
        return {
          ...current,
          items: normalizeItemOrders(
            current.items.filter((item) => item.id !== itemId),
            tenantId,
            sectionId
          ),
        };
      });
    },
    []
  );

  const moveItem = useCallback(
    (
      tenantId: string,
      sectionId: string,
      itemId: string,
      direction: -1 | 1
    ) => {
      setState((current) => ({
        ...current,
        items: moveOrdered(
          current.items,
          (item) => item.tenantId === tenantId && item.sectionId === sectionId,
          itemId,
          direction
        ),
      }));
    },
    []
  );

  const value = useMemo<FormTemplateCatalogValue>(
    () => ({
      ...state,
      ensureTenant,
      createTemplate,
      updateTemplate,
      createSection,
      updateSection,
      deleteSection,
      moveSection,
      createItem,
      updateItem,
      deleteItem,
      moveItem,
    }),
    [
      createItem,
      createSection,
      createTemplate,
      deleteItem,
      deleteSection,
      ensureTenant,
      moveItem,
      moveSection,
      state,
      updateItem,
      updateSection,
      updateTemplate,
    ]
  );

  return (
    <FormTemplateCatalogContext.Provider value={value}>
      {children}
    </FormTemplateCatalogContext.Provider>
  );
}

export function useFormTemplateCatalogStore() {
  const context = useContext(FormTemplateCatalogContext);
  if (!context) {
    throw new Error(
      'useFormTemplateCatalogStore must be used inside FormTemplateCatalogProvider'
    );
  }
  return context;
}

function assertTemplate(
  templates: FormTemplate[],
  tenantId: string,
  templateId: string
) {
  if (
    !templates.some(
      (template) => template.id === templateId && template.tenantId === tenantId
    )
  ) {
    throw new Error('La plantilla pertenece a otra empresa.');
  }
}

function assertSection(
  sections: FormSection[],
  tenantId: string,
  sectionId: string
) {
  if (
    !sections.some(
      (section) => section.id === sectionId && section.tenantId === tenantId
    )
  ) {
    throw new Error('La sección pertenece a otra empresa.');
  }
}

function assertConceptInput(
  tenantId: string,
  input: FormItemInput,
  concepts: Concept[]
) {
  if (input.type === 'TASK') return;
  const concept = concepts.find(
    (item) => item.id === input.conceptId && item.tenantId === tenantId
  );
  if (!concept) throw new Error('El concepto pertenece a otra empresa.');
}

function moveOrdered<T extends { id: string; order: number }>(
  allItems: T[],
  belongsToGroup: (item: T) => boolean,
  itemId: string,
  direction: -1 | 1
) {
  const group = allItems.filter(belongsToGroup).sort(byOrder);
  const index = group.findIndex((item) => item.id === itemId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= group.length) {
    return allItems;
  }
  const current = group[index];
  const target = group[targetIndex];
  return allItems.map((item) => {
    if (item.id === current.id) return { ...item, order: target.order };
    if (item.id === target.id) return { ...item, order: current.order };
    return item;
  });
}

function normalizeSectionOrders(
  sections: FormSection[],
  tenantId: string,
  templateId: string
) {
  const orderedIds = sections
    .filter(
      (section) =>
        section.tenantId === tenantId && section.formTemplateId === templateId
    )
    .sort(byOrder)
    .map((section) => section.id);
  const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  return sections.map((section) => ({
    ...section,
    order: orderById.get(section.id) ?? section.order,
  }));
}

function normalizeItemOrders(
  items: FormItem[],
  tenantId: string,
  sectionId: string
) {
  const orderedIds = items
    .filter(
      (item) => item.tenantId === tenantId && item.sectionId === sectionId
    )
    .sort(byOrder)
    .map((item) => item.id);
  const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  return items.map((item) => ({
    ...item,
    order: orderById.get(item.id) ?? item.order,
  }));
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}
