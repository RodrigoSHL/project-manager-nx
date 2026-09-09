import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AssetType } from '../asset-types/models';
import { normalizeConceptCode } from './concept-schema';
import { createConceptSeed } from './mock-concepts';
import type {
  AssetTypeConcept,
  Concept,
  ConceptFormValue,
  ConceptOption,
} from './models';

type ConceptCatalogState = {
  seededTenantIds: string[];
  concepts: Concept[];
  options: ConceptOption[];
  assetTypeConcepts: AssetTypeConcept[];
};

type ConceptCatalogContextValue = ConceptCatalogState & {
  ensureTenant: (tenantId: string, assetTypes: AssetType[]) => void;
  createConcept: (tenantId: string, value: ConceptFormValue) => Concept;
  updateConcept: (
    tenantId: string,
    conceptId: string,
    value: ConceptFormValue
  ) => Concept;
  setConceptActive: (
    tenantId: string,
    conceptId: string,
    active: boolean
  ) => void;
  setAssetTypeAssociation: (
    tenantId: string,
    assetType: AssetType,
    conceptId: string,
    associated: boolean
  ) => void;
};

const emptyState: ConceptCatalogState = {
  seededTenantIds: [],
  concepts: [],
  options: [],
  assetTypeConcepts: [],
};

const ConceptCatalogContext = createContext<ConceptCatalogContextValue | null>(
  null
);

export function ConceptCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConceptCatalogState>(emptyState);

  const ensureTenant = useCallback(
    (tenantId: string, assetTypes: AssetType[]) => {
      if (!tenantId || assetTypes.length === 0) return;
      setState((current) => {
        if (current.seededTenantIds.includes(tenantId)) return current;
        const tenantAssetTypes = assetTypes.filter(
          (assetType) => assetType.tenantId === tenantId
        );
        const seed = createConceptSeed(tenantId, tenantAssetTypes);
        return {
          seededTenantIds: [...current.seededTenantIds, tenantId],
          concepts: [...current.concepts, ...seed.concepts],
          options: [...current.options, ...seed.options],
          assetTypeConcepts: [
            ...current.assetTypeConcepts,
            ...seed.assetTypeConcepts,
          ],
        };
      });
    },
    []
  );

  const createConcept = useCallback(
    (tenantId: string, value: ConceptFormValue) => {
      const code = normalizeConceptCode(value.code);
      if (
        state.concepts.some(
          (item) => item.tenantId === tenantId && item.code === code
        )
      ) {
        throw new Error('Ya existe un concepto con ese código en la empresa.');
      }
      const concept: Concept = {
        id: crypto.randomUUID(),
        tenantId,
        code,
        name: value.name.trim(),
        description: value.description?.trim() || null,
        type: value.type,
        unit: value.type === 'ANALOG' ? value.unit?.trim() || null : null,
        active: value.active,
      };

      setState((current) => {
        return {
          ...current,
          concepts: [...current.concepts, concept],
          options: [
            ...current.options,
            ...createOptions(tenantId, concept.id, value),
          ],
        };
      });

      return concept;
    },
    [state.concepts]
  );

  const updateConcept = useCallback(
    (tenantId: string, conceptId: string, value: ConceptFormValue) => {
      const code = normalizeConceptCode(value.code);
      const existing = state.concepts.find(
        (item) => item.id === conceptId && item.tenantId === tenantId
      );
      if (!existing) {
        throw new Error('El concepto no pertenece a la empresa seleccionada.');
      }
      if (
        state.concepts.some(
          (item) =>
            item.tenantId === tenantId &&
            item.id !== conceptId &&
            item.code === code
        )
      ) {
        throw new Error('Ya existe un concepto con ese código en la empresa.');
      }
      const updated: Concept = {
        ...existing,
        code,
        name: value.name.trim(),
        description: value.description?.trim() || null,
        type: value.type,
        unit: value.type === 'ANALOG' ? value.unit?.trim() || null : null,
        active: value.active,
      };

      setState((current) => {
        return {
          ...current,
          concepts: current.concepts.map((item) =>
            item.id === conceptId ? updated : item
          ),
          options: [
            ...current.options.filter(
              (option) =>
                option.conceptId !== conceptId || option.tenantId !== tenantId
            ),
            ...createOptions(tenantId, conceptId, value),
          ],
        };
      });

      return updated;
    },
    [state.concepts]
  );

  const setConceptActive = useCallback(
    (tenantId: string, conceptId: string, active: boolean) => {
      const exists = state.concepts.some(
        (item) => item.id === conceptId && item.tenantId === tenantId
      );
      if (!exists) {
        throw new Error('El concepto no pertenece a la empresa seleccionada.');
      }
      setState((current) => {
        return {
          ...current,
          concepts: current.concepts.map((item) =>
            item.id === conceptId && item.tenantId === tenantId
              ? { ...item, active }
              : item
          ),
        };
      });
    },
    [state.concepts]
  );

  const setAssetTypeAssociation = useCallback(
    (
      tenantId: string,
      assetType: AssetType,
      conceptId: string,
      associated: boolean
    ) => {
      const concept = state.concepts.find(
        (item) => item.id === conceptId && item.tenantId === tenantId
      );
      if (!concept || assetType.tenantId !== tenantId) {
        throw new Error(
          'El tipo de activo y el concepto deben pertenecer a la misma empresa.'
        );
      }
      setState((current) => {
        const existing = current.assetTypeConcepts.find(
          (relation) =>
            relation.tenantId === tenantId &&
            relation.assetTypeId === assetType.id &&
            relation.conceptId === conceptId
        );

        if (existing) {
          return {
            ...current,
            assetTypeConcepts: current.assetTypeConcepts.map((relation) =>
              relation.id === existing.id
                ? { ...relation, active: associated }
                : relation
            ),
          };
        }

        if (!associated) return current;
        const order =
          current.assetTypeConcepts.filter(
            (relation) =>
              relation.tenantId === tenantId &&
              relation.assetTypeId === assetType.id &&
              relation.active
          ).length + 1;

        return {
          ...current,
          assetTypeConcepts: [
            ...current.assetTypeConcepts,
            {
              id: crypto.randomUUID(),
              tenantId,
              assetTypeId: assetType.id,
              conceptId,
              order,
              active: true,
            },
          ],
        };
      });
    },
    [state.concepts]
  );

  const value = useMemo<ConceptCatalogContextValue>(
    () => ({
      ...state,
      createConcept,
      ensureTenant,
      setAssetTypeAssociation,
      setConceptActive,
      updateConcept,
    }),
    [
      createConcept,
      ensureTenant,
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

function createOptions(
  tenantId: string,
  conceptId: string,
  value: ConceptFormValue
): ConceptOption[] {
  if (value.type !== 'DIGITAL') return [];
  return value.options.map((option) => ({
    id: crypto.randomUUID(),
    tenantId,
    conceptId,
    value: normalizeConceptCode(option.value),
    label: option.label.trim(),
    order: option.order,
    active: option.active,
  }));
}
