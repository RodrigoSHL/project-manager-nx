import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { WorkApiError, type WorkCatalogResponse } from './work-api';
import type { WorkReferenceData } from './work-reference-loader';
import { useOffline } from '../offline/offline-context';
import { localWorkRepository } from '../../repositories/local-work-repository';
import { remoteWorkRepository } from '../../repositories/remote-work-repository';
import type {
  ConceptResponse,
  CreateWorkInput,
  FinishResult,
  TaskCompletion,
  Work,
  WorkItemAnnotation,
  WorkItemValue,
  WorkTemplateSnapshot,
} from './models';

type WorkCatalogState = {
  works: Work[];
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  annotations: WorkItemAnnotation[];
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
  annotations: [],
  snapshots: [],
  catalogs: {},
  loadedTenantIds: [],
  loadingTenantIds: [],
  mutatingTenantIds: [],
  errors: {},
};

const WorkCatalogContext = createContext<WorkCatalogValue | null>(null);

export function WorkCatalogProvider({ children }: { children: ReactNode }) {
  const { mode } = useOffline();
  const repository =
    mode === 'LOCAL' ? localWorkRepository : remoteWorkRepository;
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const requestedTenantIds = useRef(new Set<string>());
  stateRef.current = state;

  useEffect(() => {
    requestedTenantIds.current.clear();
    setState(initialState);
  }, [mode]);

  const replaceTenantWorks = useCallback(
    (
      tenantId: string,
      data: WorkCatalogResponse,
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
        annotations: [
          ...current.annotations.filter((item) => item.tenantId !== tenantId),
          ...data.annotations,
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
        const result = await repository.loadTenant(tenantId);
        replaceTenantWorks(tenantId, result.data, result.catalog);
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
    [replaceTenantWorks, repository]
  );

  const refreshTenant = useCallback(
    async (tenantId: string) => {
      const result = await repository.loadTenant(tenantId);
      replaceTenantWorks(tenantId, result.data, result.catalog);
    },
    [replaceTenantWorks, repository]
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
      return runMutation(input.tenantId, () => repository.create(input));
    },
    [repository, runMutation]
  );

  const saveResponses = useCallback(
    async (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ) => {
      await runMutation(tenantId, () =>
        repository.saveResponses(tenantId, workId, values)
      );
    },
    [repository, runMutation]
  );

  const startWork = useCallback(
    async (tenantId: string, workId: string) => {
      await runMutation(tenantId, () => repository.start(tenantId, workId));
    },
    [repository, runMutation]
  );

  const finishWork = useCallback(
    async (
      tenantId: string,
      workId: string,
      values: Record<string, WorkItemValue>
    ): Promise<FinishResult> => {
      try {
        return await runMutation(tenantId, () =>
          repository.finish(tenantId, workId, values)
        );
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
    [refreshTenant, repository, runMutation]
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

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.';
}
