import { useEffect, useState } from 'react';
import { assetCatalogApi } from './asset-catalog-api';
import type { Asset, Site, Tenant } from './models';

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible cargar la información.';
}

export function useAssetCatalog() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [assetRefreshKey, setAssetRefreshKey] = useState(0);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTenants(true);
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
        if (!controller.signal.aborted) setLoadingTenants(false);
      });

    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!tenantId) return;

    const controller = new AbortController();
    setLoadingSites(true);
    setError(null);

    assetCatalogApi
      .listSites(tenantId, controller.signal)
      .then((data) => {
        setSites(data);
        setSiteId(data[0]?.id ?? '');
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSites(false);
      });

    return () => controller.abort();
  }, [retryKey, tenantId]);

  useEffect(() => {
    if (!tenantId || !siteId) return;

    const controller = new AbortController();
    setLoadingAssets(true);
    setError(null);

    assetCatalogApi
      .listAssets(tenantId, siteId, controller.signal)
      .then(setAssets)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAssets(false);
      });

    return () => controller.abort();
  }, [assetRefreshKey, retryKey, siteId, tenantId]);

  function selectTenant(nextTenantId: string) {
    setTenantId(nextTenantId);
    setSiteId('');
    setSites([]);
    setAssets([]);
  }

  function selectSite(nextSiteId: string) {
    setSiteId(nextSiteId);
    setAssets([]);
  }

  return {
    assets,
    error,
    isLoading: loadingTenants || loadingSites || loadingAssets,
    retry: () => setRetryKey((current) => current + 1),
    refreshAssets: () => setAssetRefreshKey((current) => current + 1),
    selectSite,
    selectTenant,
    siteId,
    sites,
    tenantId,
    tenants,
  };
}
