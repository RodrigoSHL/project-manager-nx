import { useEffect, useMemo, useState } from 'react';
import type { AssetType } from '../asset-types/models';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { AssetTypeConcept, Concept } from '../concepts/models';

type UseCompatibleConceptsInput = {
  tenantId: string;
  workTypeId: string;
  assetTypes: AssetType[];
  concepts: Concept[];
  relations: AssetTypeConcept[];
};

export function useCompatibleConcepts({
  tenantId,
  workTypeId,
  assetTypes,
  concepts,
  relations,
}: UseCompatibleConceptsInput) {
  const [compatibleAssetTypeIds, setCompatibleAssetTypeIds] = useState<
    string[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relevantAssetTypes = useMemo(() => {
    const assetTypeIdsWithConcepts = new Set(
      relations
        .filter((relation) => relation.tenantId === tenantId && relation.active)
        .map((item) => item.assetTypeId)
    );
    return assetTypes.filter(
      (assetType) =>
        assetType.tenantId === tenantId &&
        assetType.active &&
        assetTypeIdsWithConcepts.has(assetType.id)
    );
  }, [assetTypes, relations, tenantId]);

  useEffect(() => {
    if (!tenantId || !workTypeId || relevantAssetTypes.length === 0) {
      setCompatibleAssetTypeIds([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    Promise.all(
      relevantAssetTypes.map(async (assetType) => {
        const workTypes = await assetCatalogApi.listAssetTypeWorkTypes(
          tenantId,
          assetType.id,
          controller.signal
        );
        return workTypes.some(
          (workType) => workType.id === workTypeId && workType.associated
        )
          ? assetType.id
          : null;
      })
    )
      .then((ids) =>
        setCompatibleAssetTypeIds(ids.filter((id): id is string => id !== null))
      )
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible calcular los conceptos recomendados.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [relevantAssetTypes, tenantId, workTypeId]);

  const activeConcepts = useMemo(
    () =>
      concepts.filter(
        (concept) => concept.tenantId === tenantId && concept.active
      ),
    [concepts, tenantId]
  );
  const preferredConceptIds = useMemo(
    () =>
      new Set(
        relations
          .filter(
            (relation) =>
              relation.tenantId === tenantId &&
              relation.active &&
              compatibleAssetTypeIds.includes(relation.assetTypeId)
          )
          .map((relation) => relation.conceptId)
      ),
    [compatibleAssetTypeIds, relations, tenantId]
  );
  const preferred = activeConcepts.filter((concept) =>
    preferredConceptIds.has(concept.id)
  );
  const others = activeConcepts.filter(
    (concept) => !preferredConceptIds.has(concept.id)
  );

  return {
    compatibleAssetTypeIds,
    error,
    isLoading,
    others,
    preferred,
    usesFallback: !isLoading && preferred.length === 0,
  };
}
