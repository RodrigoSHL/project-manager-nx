import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { WorkType } from '../work-types/models';
import {
  formTemplateApi,
  type FormTemplateCatalogResponse,
} from './form-template-api';
import type {
  FormItem,
  FormItemInput,
  FormSection,
  FormSectionInput,
  FormTemplate,
  FormTemplateInput,
} from './models';

type FormTemplateCatalogState = {
  loadedTenantIds: string[];
  loadingTenantIds: string[];
  mutatingTenantIds: string[];
  errors: Record<string, string | undefined>;
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
};

type FormTemplateCatalogValue = FormTemplateCatalogState & {
  ensureTenant: (tenantId: string) => Promise<void>;
  retryTenant: (tenantId: string) => Promise<void>;
  createTemplate: (
    tenantId: string,
    workType: WorkType,
    input: FormTemplateInput
  ) => Promise<boolean>;
  updateTemplate: (
    tenantId: string,
    templateId: string,
    input: FormTemplateInput
  ) => Promise<boolean>;
  createSection: (
    tenantId: string,
    templateId: string,
    input: FormSectionInput
  ) => Promise<boolean>;
  updateSection: (
    tenantId: string,
    sectionId: string,
    input: FormSectionInput
  ) => Promise<boolean>;
  deleteSection: (tenantId: string, sectionId: string) => Promise<boolean>;
  moveSection: (
    tenantId: string,
    templateId: string,
    sectionId: string,
    direction: -1 | 1
  ) => Promise<boolean>;
  createItem: (
    tenantId: string,
    sectionId: string,
    input: FormItemInput
  ) => Promise<boolean>;
  updateItem: (
    tenantId: string,
    itemId: string,
    input: FormItemInput
  ) => Promise<boolean>;
  deleteItem: (tenantId: string, itemId: string) => Promise<boolean>;
  moveItem: (
    tenantId: string,
    sectionId: string,
    itemId: string,
    direction: -1 | 1
  ) => Promise<boolean>;
};

const emptyState: FormTemplateCatalogState = {
  loadedTenantIds: [],
  loadingTenantIds: [],
  mutatingTenantIds: [],
  errors: {},
  templates: [],
  sections: [],
  items: [],
};

const FormTemplateCatalogContext =
  createContext<FormTemplateCatalogValue | null>(null);

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible cargar los formularios.';
}

export function FormTemplateCatalogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<FormTemplateCatalogState>(emptyState);
  const stateRef = useRef(state);
  const requestedTenantIds = useRef(new Set<string>());
  stateRef.current = state;

  const replaceTenant = useCallback(
    (tenantId: string, catalog: FormTemplateCatalogResponse) => {
      setState((current) => ({
        ...current,
        loadedTenantIds: current.loadedTenantIds.includes(tenantId)
          ? current.loadedTenantIds
          : [...current.loadedTenantIds, tenantId],
        loadingTenantIds: current.loadingTenantIds.filter(
          (id) => id !== tenantId
        ),
        errors: { ...current.errors, [tenantId]: undefined },
        templates: [
          ...current.templates.filter((item) => item.tenantId !== tenantId),
          ...catalog.templates,
        ],
        sections: [
          ...current.sections.filter((item) => item.tenantId !== tenantId),
          ...catalog.sections,
        ],
        items: [
          ...current.items.filter((item) => item.tenantId !== tenantId),
          ...catalog.items,
        ],
      }));
    },
    []
  );

  const loadTenant = useCallback(
    async (tenantId: string) => {
      if (!tenantId || requestedTenantIds.current.has(tenantId)) return;
      requestedTenantIds.current.add(tenantId);
      setState((current) => ({
        ...current,
        loadingTenantIds: current.loadingTenantIds.includes(tenantId)
          ? current.loadingTenantIds
          : [...current.loadingTenantIds, tenantId],
        errors: { ...current.errors, [tenantId]: undefined },
      }));
      try {
        replaceTenant(tenantId, await formTemplateApi.list(tenantId));
      } catch (error) {
        requestedTenantIds.current.delete(tenantId);
        setState((current) => ({
          ...current,
          loadingTenantIds: current.loadingTenantIds.filter(
            (id) => id !== tenantId
          ),
          errors: { ...current.errors, [tenantId]: messageFrom(error) },
        }));
      }
    },
    [replaceTenant]
  );

  const retryTenant = useCallback(
    async (tenantId: string) => {
      requestedTenantIds.current.delete(tenantId);
      await loadTenant(tenantId);
    },
    [loadTenant]
  );

  const runMutation = useCallback(
    async (tenantId: string, action: () => Promise<unknown>) => {
      if (stateRef.current.mutatingTenantIds.includes(tenantId)) return false;
      setState((current) => ({
        ...current,
        mutatingTenantIds: [...current.mutatingTenantIds, tenantId],
        errors: { ...current.errors, [tenantId]: undefined },
      }));
      try {
        await action();
        replaceTenant(tenantId, await formTemplateApi.list(tenantId));
        setState((current) => ({
          ...current,
          mutatingTenantIds: current.mutatingTenantIds.filter(
            (id) => id !== tenantId
          ),
        }));
        return true;
      } catch (error) {
        setState((current) => ({
          ...current,
          mutatingTenantIds: current.mutatingTenantIds.filter(
            (id) => id !== tenantId
          ),
          errors: { ...current.errors, [tenantId]: messageFrom(error) },
        }));
        return false;
      }
    },
    [replaceTenant]
  );

  const createTemplate = useCallback(
    (tenantId: string, workType: WorkType, input: FormTemplateInput) => {
      if (workType.tenantId !== tenantId) return Promise.resolve(false);
      return runMutation(tenantId, () =>
        formTemplateApi.createTemplate(tenantId, workType.id, input)
      );
    },
    [runMutation]
  );

  const updateTemplate = useCallback(
    (tenantId: string, templateId: string, input: FormTemplateInput) =>
      runMutation(tenantId, () =>
        formTemplateApi.updateTemplate(tenantId, templateId, input)
      ),
    [runMutation]
  );

  const createSection = useCallback(
    (tenantId: string, templateId: string, input: FormSectionInput) =>
      runMutation(tenantId, () =>
        formTemplateApi.createSection(tenantId, templateId, input)
      ),
    [runMutation]
  );

  const updateSection = useCallback(
    (tenantId: string, sectionId: string, input: FormSectionInput) =>
      runMutation(tenantId, () =>
        formTemplateApi.updateSection(tenantId, sectionId, input)
      ),
    [runMutation]
  );

  const deleteSection = useCallback(
    (tenantId: string, sectionId: string) =>
      runMutation(tenantId, () =>
        formTemplateApi.deleteSection(tenantId, sectionId)
      ),
    [runMutation]
  );

  const moveSection = useCallback(
    (
      tenantId: string,
      templateId: string,
      sectionId: string,
      direction: -1 | 1
    ) => {
      const group = stateRef.current.sections
        .filter(
          (item) =>
            item.tenantId === tenantId && item.formTemplateId === templateId
        )
        .sort(byOrder);
      const orderedIds = moveIds(group, sectionId, direction);
      if (!orderedIds) return Promise.resolve(false);
      return runMutation(tenantId, () =>
        formTemplateApi.reorderSections(tenantId, templateId, orderedIds)
      );
    },
    [runMutation]
  );

  const createItem = useCallback(
    (tenantId: string, sectionId: string, input: FormItemInput) =>
      runMutation(tenantId, () =>
        formTemplateApi.createItem(tenantId, sectionId, input)
      ),
    [runMutation]
  );

  const updateItem = useCallback(
    (tenantId: string, itemId: string, input: FormItemInput) =>
      runMutation(tenantId, () =>
        formTemplateApi.updateItem(tenantId, itemId, input)
      ),
    [runMutation]
  );

  const deleteItem = useCallback(
    (tenantId: string, itemId: string) =>
      runMutation(tenantId, () => formTemplateApi.deleteItem(tenantId, itemId)),
    [runMutation]
  );

  const moveItem = useCallback(
    (
      tenantId: string,
      sectionId: string,
      itemId: string,
      direction: -1 | 1
    ) => {
      const group = stateRef.current.items
        .filter(
          (item) => item.tenantId === tenantId && item.sectionId === sectionId
        )
        .sort(byOrder);
      const orderedIds = moveIds(group, itemId, direction);
      if (!orderedIds) return Promise.resolve(false);
      return runMutation(tenantId, () =>
        formTemplateApi.reorderItems(tenantId, sectionId, orderedIds)
      );
    },
    [runMutation]
  );

  const value = useMemo<FormTemplateCatalogValue>(
    () => ({
      ...state,
      ensureTenant: loadTenant,
      retryTenant,
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
      loadTenant,
      moveItem,
      moveSection,
      retryTenant,
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

function moveIds<T extends { id: string }>(
  items: T[],
  itemId: string,
  direction: -1 | 1
) {
  const ids = items.map((item) => item.id);
  const index = ids.indexOf(itemId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}
