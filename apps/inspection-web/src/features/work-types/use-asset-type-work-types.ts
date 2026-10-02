import { useEffect, useState } from 'react';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { AssetTypeWorkTypeOption } from './models';

export function useAssetTypeWorkTypes(
  tenantId: string,
  assetTypeId: string,
  catalogVersion: string
) {
  const [workTypes, setWorkTypes] = useState<AssetTypeWorkTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !assetTypeId) {
      setWorkTypes([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    assetCatalogApi
      .listAssetTypeWorkTypes(tenantId, assetTypeId, controller.signal)
      .then(setWorkTypes)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [assetTypeId, catalogVersion, tenantId]);

  async function setAssociated(workTypeId: string, associated: boolean) {
    if (!tenantId || !assetTypeId) return;
    setMutatingId(workTypeId);
    setError(null);
    try {
      if (associated) {
        await assetCatalogApi.associateAssetTypeWorkType(
          tenantId,
          assetTypeId,
          workTypeId
        );
      } else {
        await assetCatalogApi.disassociateAssetTypeWorkType(
          tenantId,
          assetTypeId,
          workTypeId
        );
      }
      setWorkTypes((current) =>
        current.map((item) =>
          item.id === workTypeId ? { ...item, associated } : item
        )
      );
    } catch (mutationError) {
      setError(errorMessage(mutationError));
    } finally {
      setMutatingId(null);
    }
  }

  return { error, isLoading, mutatingId, setAssociated, workTypes };
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible modificar la asociación.';
}
