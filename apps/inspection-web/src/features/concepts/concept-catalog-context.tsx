import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AssetType } from '../asset-types/models';
import { conceptApi, type ConceptWithOptions } from './concept-api';
import type {
  AssetTypeConcept,
  Concept,
  ConceptFormValue,
  ConceptOption,
} from './models';

type ConceptCatalogState = {
  loadedTenantIds: string[];
  loadingTenantIds: string[];
  errors: Record<string, string | undefined>;
  concepts: Concept[];
  options: ConceptOption[];
  assetTypeConcepts: AssetTypeConcept[];
};

type ConceptCatalogContextValue = ConceptCatalogState & {
  ensureTenant: (tenantId: string) => Promise<void>;
  retryTenant: (tenantId: string) => Promise<void>;
  createConcept: (
    tenantId: string,
    value: ConceptFormValue
  ) => Promise<Concept>;
  updateConcept: (
    tenantId: string,
    conceptId: string,
    value: ConceptFormValue
  ) => Promise<Concept>;
  setConceptActive: (
    tenantId: string,
    conceptId: string,
    active: boolean
  ) => Promise<void>;
  setAssetTypeAssociation: (
    tenantId: string,
    assetType: AssetType,
    conceptId: string,
    associated: boolean
  ) => Promise<void>;
};

const emptyState: ConceptCatalogState = {
  loadedTenantIds: [],
  loadingTenantIds: [],
  errors: {},
  concepts: [],
  options: [],
  assetTypeConcepts: [],
};

const ConceptCatalogContext = createContext<ConceptCatalogContextValue | null>(
  null
);

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible cargar los conceptos.';
}

export function ConceptCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConceptCatalogState>(emptyState);
  const requestedTenantIds = useRef(new Set<string>());

  const loadTenant = useCallback(async (tenantId: string) => {
    if (!tenantId || requestedTenantIds.current.has(tenantId)) return;
    requestedTenantIds.current.add(tenantId);
    setState((current) => ({
      ...current,
      loadingTenantIds: [...current.loadingTenantIds, tenantId],
      errors: { ...current.errors, [tenantId]: undefined },
    }));

    try {
      const [conceptsWithOptions, relations] = await Promise.all([
        conceptApi.listConcepts(tenantId),
        conceptApi.listAssetTypeConcepts(tenantId),
      ]);
      setState((current) => ({
        ...current,
        loadedTenantIds: current.loadedTenantIds.includes(tenantId)
          ? current.loadedTenantIds
          : [...current.loadedTenantIds, tenantId],
        loadingTenantIds: current.loadingTenantIds.filter(
          (id) => id !== tenantId
        ),
        concepts: [
          ...current.concepts.filter((item) => item.tenantId !== tenantId),
          ...conceptsWithOptions.map(toConcept),
        ],
        options: [
          ...current.options.filter((item) => item.tenantId !== tenantId),
          ...conceptsWithOptions.flatMap((concept) => concept.options),
        ],
        assetTypeConcepts: [
          ...current.assetTypeConcepts.filter(
            (item) => item.tenantId !== tenantId
          ),
          ...relations,
        ],
      }));
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
  }, []);

  const ensureTenant = useCallback(
    async (tenantId: string) => loadTenant(tenantId),
    [loadTenant]
  );

  const retryTenant = useCallback(
    async (tenantId: string) => {
      requestedTenantIds.current.delete(tenantId);
      await loadTenant(tenantId);
    },
    [loadTenant]
  );

  const replaceConcept = useCallback((saved: ConceptWithOptions) => {
    const { options, ...concept } = saved;
    setState((current) => ({
      ...current,
      concepts: [
        ...current.concepts.filter(
          (item) => item.id !== concept.id || item.tenantId !== concept.tenantId
        ),
        concept,
      ],
      options: [
        ...current.options.filter(
          (item) =>
            item.conceptId !== concept.id || item.tenantId !== concept.tenantId
        ),
        ...options,
      ],
    }));
    return concept;
  }, []);

  const createConcept = useCallback(
    async (tenantId: string, value: ConceptFormValue) =>
      replaceConcept(await conceptApi.createConcept(tenantId, value)),
    [replaceConcept]
  );

  const updateConcept = useCallback(
    async (tenantId: string, conceptId: string, value: ConceptFormValue) =>
      replaceConcept(
        await conceptApi.updateConcept(tenantId, conceptId, value)
      ),
    [replaceConcept]
  );

  const setConceptActive = useCallback(
    async (tenantId: string, conceptId: string, active: boolean) => {
      try {
        replaceConcept(
          await conceptApi.updateConcept(tenantId, conceptId, { active })
        );
        setState((current) => ({
          ...current,
          errors: { ...current.errors, [tenantId]: undefined },
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          errors: { ...current.errors, [tenantId]: messageFrom(error) },
        }));
        throw error;
      }
    },
    [replaceConcept]
  );

  const setAssetTypeAssociation = useCallback(
    async (
      tenantId: string,
      assetType: AssetType,
      conceptId: string,
      associated: boolean
    ) => {
      if (assetType.tenantId !== tenantId) {
        throw new Error(
          'El tipo de activo debe pertenecer a la empresa seleccionada.'
        );
      }
      let saved: AssetTypeConcept;
      try {
        saved = associated
          ? await conceptApi.associateAssetTypeConcept(
              tenantId,
              assetType.id,
              conceptId
            )
          : await conceptApi.disassociateAssetTypeConcept(
              tenantId,
              assetType.id,
              conceptId
            );
      } catch (error) {
        setState((current) => ({
          ...current,
          errors: { ...current.errors, [tenantId]: messageFrom(error) },
        }));
        throw error;
      }
      const normalized: AssetTypeConcept = { ...saved, active: associated };

      setState((current) => {
        const existing = current.assetTypeConcepts.find(
          (relation) =>
            relation.tenantId === tenantId &&
            relation.assetTypeId === assetType.id &&
            relation.conceptId === conceptId
        );
        return {
          ...current,
          errors: { ...current.errors, [tenantId]: undefined },
          assetTypeConcepts: existing
            ? current.assetTypeConcepts.map((relation) =>
                relation.id === existing.id ? normalized : relation
              )
            : [...current.assetTypeConcepts, normalized],
        };
      });
    },
    []
  );

  const value = useMemo<ConceptCatalogContextValue>(
    () => ({
      ...state,
      createConcept,
      ensureTenant,
      retryTenant,
      setAssetTypeAssociation,
      setConceptActive,
      updateConcept,
    }),
    [
      createConcept,
      ensureTenant,
      retryTenant,
      setAssetTypeAssociation,
      setConceptActive,
      state,
      updateConcept,
    ]
  );

  return (
    <ConceptCatalogContext.Provider value={value}>
      {children}
    </ConceptCatalogContext.Provider>
  );
}

export function useConceptCatalogStore() {
  const context = useContext(ConceptCatalogContext);
  if (!context) {
    throw new Error(
      'useConceptCatalogStore must be used inside ConceptCatalogProvider'
    );
  }
  return context;
}

function toConcept(value: ConceptWithOptions): Concept {
  return {
    id: value.id,
    tenantId: value.tenantId,
    code: value.code,
    name: value.name,
    description: value.description,
    type: value.type,
    unit: value.unit,
    active: value.active,
  };
}
