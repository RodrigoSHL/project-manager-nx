import { useEffect, useState } from 'react';
import type { AssetType } from '../asset-types/models';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { Tenant } from '../assets/models';
import type { WorkType } from '../work-types/models';

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible cargar los catálogos.';
}

export function useReferenceCatalog() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    assetCatalogApi
      .listTenants(controller.signal)
      .then((data) => {
        setTenants(data);
        setTenantId((current) =>
          data.some((tenant) => tenant.id === current)
            ? current
            : data[0]?.id ?? ''
        );
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted && !tenantId) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!tenantId) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    Promise.all([
      assetCatalogApi.listAssetTypes(tenantId, controller.signal),
      assetCatalogApi.listWorkTypes(tenantId, controller.signal),
    ])
      .then(([assetTypeData, workTypeData]) => {
        setAssetTypes(assetTypeData);
        setWorkTypes(workTypeData);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryKey, tenantId]);

  function selectTenant(nextTenantId: string) {
    setTenantId(nextTenantId);
    setAssetTypes([]);
    setWorkTypes([]);
  }

  return {
    assetTypes,
    error,
    isLoading,
    retry: () => setRetryKey((current) => current + 1),
    selectTenant,
    tenantId,
    tenants,
    workTypes,
  };
}
