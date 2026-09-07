import { useEffect, useState } from 'react';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { Asset } from '../assets/models';
import type { AssetWorkTypeConfiguration } from './models';

export type WorkTypeOverrideValue = 'INHERIT' | 'ALLOW' | 'BLOCK';

export function useAssetWorkTypeConfiguration(asset: Asset) {
  const [configurations, setConfigurations] = useState<
    AssetWorkTypeConfiguration[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setConfigurations([]);
    setIsLoading(true);
    setError(null);
    assetCatalogApi
      .listAssetWorkTypeConfigurations(
        asset.tenantId,
        asset.siteId,
        asset.id,
        controller.signal
      )
      .then(setConfigurations)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [asset.id, asset.siteId, asset.tenantId]);

  async function setOverride(workTypeId: string, value: WorkTypeOverrideValue) {
    setMutatingId(workTypeId);
    setError(null);
    try {
      const override =
        value === 'INHERIT' ? null : value === 'ALLOW' ? true : false;
      if (override === null) {
        await assetCatalogApi.clearAssetWorkTypeOverride(
          asset.tenantId,
          asset.siteId,
          asset.id,
          workTypeId
        );
      } else {
        await assetCatalogApi.setAssetWorkTypeOverride(
          asset.tenantId,
          asset.siteId,
          asset.id,
          workTypeId,
          override
        );
      }

      setConfigurations((current) =>
        current.map((item) => {
          if (item.id !== workTypeId) return item;
          return {
            ...item,
            override,
            effectiveEnabled: override ?? item.typeEnabled,
            source:
              override !== null
                ? 'ASSET'
                : item.typeEnabled
                ? 'ASSET_TYPE'
                : 'NONE',
          };
        })
      );
      return true;
    } catch (mutationError) {
      setError(errorMessage(mutationError));
      return false;
    } finally {
      setMutatingId(null);
    }
  }

  return {
    configurations,
    error,
    isLoading,
    mutatingId,
    setOverride,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible guardar la excepción.';
}
