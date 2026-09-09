import { useEffect, useMemo } from 'react';
import type { AssetType } from '../asset-types/models';
import { useConceptCatalogStore } from './concept-catalog-context';
import type { AvailableConcept, ConceptFormValue } from './models';

export function useConceptCatalog(tenantId: string, assetTypes: AssetType[]) {
  const store = useConceptCatalogStore();

  useEffect(() => {
    void store.ensureTenant(tenantId);
  }, [store.ensureTenant, tenantId]);

  const concepts = useMemo(
    () =>
      store.concepts
        .filter((concept) => concept.tenantId === tenantId)
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [store.concepts, tenantId]
  );
  const options = useMemo(
    () => store.options.filter((option) => option.tenantId === tenantId),
    [store.options, tenantId]
  );
  const assetTypeConcepts = useMemo(
    () =>
      store.assetTypeConcepts.filter(
        (relation) => relation.tenantId === tenantId
      ),
    [store.assetTypeConcepts, tenantId]
  );

  function createConcept(value: ConceptFormValue) {
    return store.createConcept(tenantId, value);
  }

  function updateConcept(conceptId: string, value: ConceptFormValue) {
    return store.updateConcept(tenantId, conceptId, value);
  }

  function setConceptActive(conceptId: string, active: boolean) {
    return store.setConceptActive(tenantId, conceptId, active);
  }

  function setAssetTypeAssociation(
    assetType: AssetType,
    conceptId: string,
    associated: boolean
  ) {
    return store.setAssetTypeAssociation(
      tenantId,
      assetType,
      conceptId,
      associated
    );
  }

  function listAvailableForAssetType(assetTypeId: string): AvailableConcept[] {
    const relations = assetTypeConcepts.filter(
      (relation) => relation.assetTypeId === assetTypeId && relation.active
    );
    const relationByConcept = new Map(
      relations.map((relation) => [relation.conceptId, relation])
    );

    return concepts
      .filter((concept) => concept.active && relationByConcept.has(concept.id))
      .map((concept) => ({
        ...concept,
        relationOrder: relationByConcept.get(concept.id)?.order,
        options: options
          .filter((option) => option.conceptId === concept.id && option.active)
          .sort((a, b) => a.order - b.order),
      }))
      .sort(
        (a, b) =>
          (a.relationOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.relationOrder ?? Number.MAX_SAFE_INTEGER) ||
          a.name.localeCompare(b.name, 'es')
      );
  }

  return {
    assetTypeConcepts,
    concepts,
    createConcept,
    listAvailableForAssetType,
    options,
    error: store.errors[tenantId] ?? null,
    isLoading: store.loadingTenantIds.includes(tenantId),
    retry: () => store.retryTenant(tenantId),
    setAssetTypeAssociation,
    setConceptActive,
    updateConcept,
  };
}
