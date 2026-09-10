import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toWorkResponsesPayload, workApi, WorkApiError } from './work-api';
import {
  loadWorkReferenceCatalog,
  type WorkReferenceData,
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
  catalogs: Record<string, WorkReferenceData | undefined>;
  loadedTenantIds: string[];
  loadingTenantIds: string[];
  mutatingTenantIds: string[];
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
  ) => Promise<void>;
  startWork: (tenantId: string, workId: string) => Promise<void>;
  finishWork: (
    tenantId: string,
    workId: string,
    values: Record<string, WorkItemValue>
  ) => Promise<FinishResult>;
};

const initialState: WorkCatalogState = {
  works: [],
  responses: [],
  taskCompletions: [],
  snapshots: [],
  catalogs: {},
  loadedTenantIds: [],
  loadingTenantIds: [],
  mutatingTenantIds: [],
  errors: {},
};

const WorkCatalogContext = createContext<WorkCatalogValue | null>(null);

export function WorkCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const requestedTenantIds = useRef(new Set<string>());
  stateRef.current = state;

  const replaceTenantWorks = useCallback(
    (
      tenantId: string,
      data: Awaited<ReturnType<typeof workApi.list>>,
      catalog?: WorkReferenceData
    ) => {
      setState((current) => ({
        ...current,
        works: [
          ...current.works.filter((item) => item.tenantId !== tenantId),
          ...data.works,
        ],
        responses: [
          ...current.responses.filter((item) => item.tenantId !== tenantId),
          ...data.responses,
        ],
        taskCompletions: [
          ...current.taskCompletions.filter(
            (item) => item.tenantId !== tenantId
          ),
          ...data.taskCompletions,
        ],
        snapshots: [
          ...current.snapshots.filter((item) => item.tenantId !== tenantId),
          ...data.snapshots,
        ],
        catalogs: catalog
          ? { ...current.catalogs, [tenantId]: catalog }
          : current.catalogs,
        loadedTenantIds: current.loadedTenantIds.includes(tenantId)
          ? current.loadedTenantIds
          : [...current.loadedTenantIds, tenantId],
        loadingTenantIds: current.loadingTenantIds.filter(
          (id) => id !== tenantId
        ),
        errors: { ...current.errors, [tenantId]: undefined },
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
        const [catalog, works] = await Promise.all([
          loadWorkReferenceCatalog(tenantId),
          workApi.list(tenantId),
        ]);
        replaceTenantWorks(tenantId, works, catalog);
      } catch (error) {
        requestedTenantIds.current.delete(tenantId);
        setState((current) => ({
          ...current,
          loadingTenantIds: current.loadingTenantIds.filter(
            (id) => id !== tenantId
          ),
          errors: {
            ...current.errors,
            [tenantId]: messageFrom(error),
          },
        }));
      }
    },
    [replaceTenantWorks]
  );

  const refreshTenant = useCallback(
    async (tenantId: string) => {
      replaceTenantWorks(tenantId, await workApi.list(tenantId));
    },
    [replaceTenantWorks]
  );

  const retryTenant = useCallback(
    async (tenantId: string) => {
      requestedTenantIds.current.delete(tenantId);
      await loadTenant(tenantId);
    },
    [loadTenant]
  );

  const runMutation = useCallback(
    async <T,>(tenantId: string, action: () => Promise<T>) => {
      if (stateRef.current.mutatingTenantIds.includes(tenantId)) {
        throw new WorkApiError(
          'Ya hay una operación en curso para esta empresa.'
        );
      }
      setState((current) => ({
        ...current,
        mutatingTenantIds: [...current.mutatingTenantIds, tenantId],
        errors: { ...current.errors, [tenantId]: undefined },
      }));
      try {
        const result = await action();
        await refreshTenant(tenantId);
        return result;
      } finally {
        setState((current) => ({
          ...current,
          mutatingTenantIds: current.mutatingTenantIds.filter(
            (id) => id !== tenantId
          ),
        }));
      }
    },
    [refreshTenant]
  );

  const createWork = useCallback(
    async (input: CreateWorkInput) => {
      const result = await runMutation(input.tenantId, () =>
        workApi.create(input)
      );
      return result.work;
    },
    [runMutation]
  );

  const saveResponses = useCallback(
    async (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ) => {
      const snapshot = findSnapshot(stateRef.current, tenantId, workId);
      await runMutation(tenantId, () =>
        workApi.saveResponses(
          tenantId,
          workId,
          toWorkResponsesPayload(snapshot, values)
        )
      );
    },
    [runMutation]
  );

  const startWork = useCallback(
    async (tenantId: string, workId: string) => {
      await runMutation(tenantId, () => workApi.start(tenantId, workId));
    },
    [runMutation]
  );

  const finishWork = useCallback(
    async (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ): Promise<FinishResult> => {
      const snapshot = findSnapshot(stateRef.current, tenantId, workId);
      try {
        await runMutation(tenantId, () =>
          workApi.finish(
            tenantId,
            workId,
            toWorkResponsesPayload(snapshot, values)
          )
        );
        return { ok: true };
      } catch (error) {
        if (error instanceof WorkApiError) {
          await refreshTenant(tenantId);
          return {
            ok: false,
            message: error.message,
            missingLabels: error.missingLabels,
          };
        }
        throw error;
      }
    },
    [refreshTenant, runMutation]
  );

  const value = useMemo<WorkCatalogValue>(
    () => ({
      ...state,
      ensureTenant: loadTenant,
      retryTenant,
      createWork,
      saveResponses,
      startWork,
      finishWork,
    }),
    [
      createWork,
      finishWork,
      loadTenant,
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

function findSnapshot(
  state: WorkCatalogState,
  tenantId: string,
  workId: string
) {
  const work = state.works.find(
    (item) => item.id === workId && item.tenantId === tenantId
  );
  const snapshot = state.snapshots.find(
    (item) => item.workId === workId && item.tenantId === tenantId
  );
  if (!work || !snapshot) {
    throw new WorkApiError('El trabajo no pertenece a esta empresa.');
  }
  return snapshot;
}

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.';
}
