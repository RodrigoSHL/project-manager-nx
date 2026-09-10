import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import { createMockWorkSeed } from './mock-works';
import { createTemplateSnapshot } from './work-snapshot';
import {
  loadWorkSeedCatalog,
  type WorkSeedCatalog,
} from './work-reference-loader';
import type {
  ConceptResponse,
  CreateWorkInput,
  FinishResult,
  TaskCompletion,
  Work,
  WorkItemValue,
  WorkTemplateSnapshot,
} from './models';

type WorkCatalogState = {
  works: Work[];
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  snapshots: WorkTemplateSnapshot[];
  catalogs: Record<string, WorkSeedCatalog | undefined>;
  loadingTenantIds: string[];
  errors: Record<string, string | undefined>;
};

type WorkCatalogValue = WorkCatalogState & {
  ensureTenant: (tenantId: string) => Promise<void>;
  retryTenant: (tenantId: string) => Promise<void>;
  createWork: (input: CreateWorkInput) => Promise<Work>;
  saveResponses: (
    tenantId: string,
    workId: string,
    values: Record<string, WorkItemValue>
  ) => void;
  startWork: (tenantId: string, workId: string) => void;
  finishWork: (
    tenantId: string,
    workId: string,
    values: Record<string, WorkItemValue>
  ) => FinishResult;
};

const initialState: WorkCatalogState = {
  works: [],
  responses: [],
  taskCompletions: [],
  snapshots: [],
  catalogs: {},
  loadingTenantIds: [],
  errors: {},
};

const WorkCatalogContext = createContext<WorkCatalogValue | null>(null);

export function WorkCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const requestedTenantIds = useRef(new Set<string>());
  stateRef.current = state;

  const ensureTenant = useCallback(async (tenantId: string) => {
    if (!tenantId || requestedTenantIds.current.has(tenantId)) return;
    requestedTenantIds.current.add(tenantId);
    setState((current) => ({
      ...current,
      loadingTenantIds: [...current.loadingTenantIds, tenantId],
      errors: { ...current.errors, [tenantId]: undefined },
    }));
    try {
      const catalog = await loadWorkSeedCatalog(tenantId);
      const seed = createMockWorkSeed(catalog);
      setState((current) => {
        const alreadySeeded = current.catalogs[tenantId] !== undefined;
        return {
          ...current,
          catalogs: { ...current.catalogs, [tenantId]: catalog },
          works: alreadySeeded
            ? current.works
            : [...current.works, ...seed.works],
          responses: alreadySeeded
            ? current.responses
            : [...current.responses, ...seed.responses],
          taskCompletions: alreadySeeded
            ? current.taskCompletions
            : [...current.taskCompletions, ...seed.taskCompletions],
          snapshots: alreadySeeded
            ? current.snapshots
            : [...current.snapshots, ...seed.snapshots],
          loadingTenantIds: current.loadingTenantIds.filter(
            (id) => id !== tenantId
          ),
        };
      });
    } catch (error) {
      requestedTenantIds.current.delete(tenantId);
      setState((current) => ({
        ...current,
        loadingTenantIds: current.loadingTenantIds.filter(
          (id) => id !== tenantId
        ),
        errors: {
          ...current.errors,
          [tenantId]:
            error instanceof Error
              ? error.message
              : 'No fue posible preparar los trabajos locales.',
        },
      }));
    }
  }, []);

  const retryTenant = useCallback(
    async (tenantId: string) => {
      requestedTenantIds.current.delete(tenantId);
      await ensureTenant(tenantId);
    },
    [ensureTenant]
  );

  const createWork = useCallback(async (input: CreateWorkInput) => {
    const catalog = stateRef.current.catalogs[input.tenantId];
    if (!catalog)
      throw new Error('El catálogo de esta empresa aún no está cargado.');
    const asset = catalog.assets.find(
      (item) =>
        item.id === input.assetId &&
        item.siteId === input.siteId &&
        item.tenantId === input.tenantId
    );
    const site = catalog.sites.find(
      (item) => item.id === input.siteId && item.tenantId === input.tenantId
    );
    const workType = catalog.workTypes.find(
      (item) => item.id === input.workTypeId && item.tenantId === input.tenantId
    );
    if (!asset || !site || !workType) {
      throw new Error(
        'El activo, la ubicación y el tipo deben pertenecer a la misma empresa.'
      );
    }
    const effective = await assetCatalogApi.listEffectiveWorkTypes(
      input.tenantId,
      input.siteId,
      input.assetId
    );
    if (!effective.some((item) => item.id === input.workTypeId)) {
      throw new Error(
        'Este tipo de trabajo no está habilitado para el activo.'
      );
    }
    const template = catalog.templates.find(
      (item) =>
        item.tenantId === input.tenantId &&
        item.workTypeId === input.workTypeId &&
        item.active
    );
    if (!template)
      throw new Error('El tipo de trabajo no tiene una plantilla activa.');

    const timestamp = new Date().toISOString();
    const work: Work = {
      ...input,
      id: crypto.randomUUID(),
      company: input.company?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      formTemplateId: template.id,
      formTemplateVersion: template.version,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const snapshot = createTemplateSnapshot(
      work.id,
      input.tenantId,
      template.id,
      catalog
    );
    setState((current) => ({
      ...current,
      works: [...current.works, work],
      snapshots: [...current.snapshots, snapshot],
    }));
    return work;
  }, []);

  const saveResponses = useCallback(
    (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ) => {
      setState((current) =>
        saveResponseState(current, tenantId, workId, values)
      );
    },
    []
  );

  const startWork = useCallback((tenantId: string, workId: string) => {
    setState((current) => ({
      ...current,
      works: current.works.map((work) =>
        work.id === workId &&
        work.tenantId === tenantId &&
        work.status === 'DRAFT'
          ? {
              ...work,
              status: 'IN_PROGRESS',
              updatedAt: new Date().toISOString(),
            }
          : work
      ),
    }));
  }, []);

  const finishWork = useCallback(
    (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ): FinishResult => {
      const current = saveResponseState(
        stateRef.current,
        tenantId,
        workId,
        values
      );
      const work = current.works.find(
        (item) => item.id === workId && item.tenantId === tenantId
      );
      const snapshot = current.snapshots.find(
        (item) => item.workId === workId && item.tenantId === tenantId
      );
      if (!work || !snapshot) {
        return {
          ok: false,
          message: 'El trabajo no pertenece a esta empresa.',
          missingLabels: [],
        };
      }
      if (work.status !== 'IN_PROGRESS') {
        return {
          ok: false,
          message: 'Primero debes iniciar el trabajo.',
          missingLabels: [],
        };
      }
      const responseByItem = new Map(
        current.responses
          .filter(
            (response) =>
              response.tenantId === tenantId && response.workId === workId
          )
          .map((response) => [response.formItemId, response])
      );
      const completedTaskIds = new Set(
        current.taskCompletions
          .filter(
            (completion) =>
              completion.tenantId === tenantId &&
              completion.workId === workId &&
              completion.completed
          )
          .map((completion) => completion.formItemId)
      );
      const missingLabels = snapshot.sections.flatMap((section) =>
        section.items
          .filter(
            (item) =>
              item.required &&
              ((item.type === 'TASK' && !completedTaskIds.has(item.id)) ||
                (item.type === 'CONCEPT' &&
                  item.concept?.type !== 'HIDDEN' &&
                  !responseByItem.has(item.id)))
          )
          .map(
            (item) => item.concept?.name ?? item.title ?? 'Campo obligatorio'
          )
      );
      if (missingLabels.length > 0) {
        setState(current);
        stateRef.current = current;
        return {
          ok: false,
          message: `Faltan ${missingLabels.length} campos obligatorios.`,
          missingLabels,
        };
      }
      const finished = {
        ...current,
        works: current.works.map((item) =>
          item.id === workId && item.tenantId === tenantId
            ? {
                ...item,
                status: 'FINISHED' as const,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      };
      setState(finished);
      stateRef.current = finished;
      return { ok: true };
    },
    []
  );

  const value = useMemo<WorkCatalogValue>(
    () => ({
      ...state,
      ensureTenant,
      retryTenant,
      createWork,
      saveResponses,
      startWork,
      finishWork,
    }),
    [
      createWork,
      ensureTenant,
      finishWork,
      retryTenant,
      saveResponses,
      startWork,
      state,
    ]
  );

  return (
    <WorkCatalogContext.Provider value={value}>
      {children}
    </WorkCatalogContext.Provider>
  );
}

export function useWorkCatalogStore() {
  const context = useContext(WorkCatalogContext);
  if (!context)
    throw new Error('useWorkCatalogStore requiere WorkCatalogProvider.');
  return context;
}

function saveResponseState(
  current: WorkCatalogState,
  tenantId: string,
  workId: string,
  values: Record<string, WorkItemValue>
): WorkCatalogState {
  const work = current.works.find(
    (item) => item.id === workId && item.tenantId === tenantId
  );
  const snapshot = current.snapshots.find(
    (item) => item.workId === workId && item.tenantId === tenantId
  );
  if (
    !work ||
    !snapshot ||
    work.status === 'FINISHED' ||
    work.status === 'REVIEWED'
  ) {
    return current;
  }
  const previous = new Map(
    current.responses
      .filter((item) => item.tenantId === tenantId && item.workId === workId)
      .map((item) => [item.formItemId, item])
  );
  const timestamp = new Date().toISOString();
  const next = snapshot.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      if (item.type !== 'CONCEPT' || !item.concept) return [];
      const normalized = normalizeResponse(item.concept.type, values[item.id]);
      if (!normalized) return [];
      const old = previous.get(item.id);
      return [
        {
          id: old?.id ?? crypto.randomUUID(),
          tenantId,
          workId,
          formItemId: item.id,
          conceptId: item.concept.id,
          createdAt: old?.createdAt ?? timestamp,
          updatedAt: timestamp,
          ...normalized,
        },
      ];
    })
  );
  const previousTasks = new Map(
    current.taskCompletions
      .filter((item) => item.tenantId === tenantId && item.workId === workId)
      .map((item) => [item.formItemId, item])
  );
  const nextTasks = snapshot.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      if (item.type !== 'TASK' || !values[item.id]?.completed) return [];
      const old = previousTasks.get(item.id);
      return [
        {
          id: old?.id ?? crypto.randomUUID(),
          tenantId,
          workId,
          formItemId: item.id,
          completed: true,
          createdAt: old?.createdAt ?? timestamp,
          updatedAt: timestamp,
        },
      ];
    })
  );
  return {
    ...current,
    responses: [
      ...current.responses.filter(
        (item) => item.tenantId !== tenantId || item.workId !== workId
      ),
      ...next,
    ],
    taskCompletions: [
      ...current.taskCompletions.filter(
        (item) => item.tenantId !== tenantId || item.workId !== workId
      ),
      ...nextTasks,
    ],
    works: current.works.map((item) =>
      item.id === workId && item.tenantId === tenantId
        ? { ...item, updatedAt: timestamp }
        : item
    ),
  };
}

function normalizeResponse(
  type: string,
  value?: WorkItemValue
): WorkItemValue | null {
  if (!value) return null;
  if (type === 'ANALOG' && Number.isFinite(value.valueNumber)) {
    return { valueNumber: value.valueNumber };
  }
  if (type === 'DIGITAL' && value.selectedOptionId) {
    return { selectedOptionId: value.selectedOptionId };
  }
  if (type === 'TEXT' && value.valueText?.trim()) {
    return { valueText: value.valueText.trim() };
  }
  return null;
}
