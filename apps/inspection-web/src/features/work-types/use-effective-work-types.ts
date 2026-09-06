import { useEffect, useState } from 'react';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { Asset } from '../assets/models';
import type { EffectiveWorkType } from './models';

export function useEffectiveWorkTypes(asset: Asset) {
  const [workTypes, setWorkTypes] = useState<EffectiveWorkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setWorkTypes([]);
    setIsLoading(true);
    setError(null);

    assetCatalogApi
      .listEffectiveWorkTypes(
        asset.tenantId,
        asset.siteId,
        asset.id,
        controller.signal
      )
      .then(setWorkTypes)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar los tipos de trabajo.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [asset.id, asset.siteId, asset.tenantId]);

  return { error, isLoading, workTypes };
}
