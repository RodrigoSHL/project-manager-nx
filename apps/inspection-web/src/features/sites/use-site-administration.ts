import { useEffect, useState } from 'react';
import {
  assetCatalogApi,
  type SiteMutationInput,
} from '../assets/asset-catalog-api';
import type { Site, Tenant } from '../assets/models';
import { useAuth } from '../auth/auth-context';
import {
  organizationSelectionStorage,
  resolveAvailableSelection,
} from '../tenants/organization-selection-storage';

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.';
}

export function useSiteAdministration() {
  const { user } = useAuth();
  const userId = user?.userId ?? '';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    assetCatalogApi
      .listAdministrableTenants(controller.signal)
      .then((data) => {
        setTenants(data);
        setTenantId((current) => {
          return resolveAvailableSelection(
            data,
            current,
            organizationSelectionStorage.getTenantId(userId)
          );
        });
        if (data.length === 0) setIsLoading(false);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(requestError));
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [retryKey, userId]);

  useEffect(() => {
    if (!tenantId) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    assetCatalogApi
      .listSites(tenantId, controller.signal)
      .then(setSites)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryKey, tenantId]);

  function selectTenant(nextTenantId: string) {
    organizationSelectionStorage.rememberTenant(userId, nextTenantId);
    setTenantId(nextTenantId);
    setSites([]);
    setMutationError(null);
  }

  async function createSite(input: SiteMutationInput) {
    if (!tenantId) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      const created = await assetCatalogApi.createSite(tenantId, input);
      setSites((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      return created;
    } catch (mutation) {
      setMutationError(errorMessage(mutation));
      throw mutation;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateSite(siteId: string, input: Partial<SiteMutationInput>) {
    if (!tenantId) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      const updated = await assetCatalogApi.updateSite(tenantId, siteId, input);
      setSites((current) =>
        current
          .map((site) => (site.id === updated.id ? updated : site))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return updated;
    } catch (mutation) {
      setMutationError(errorMessage(mutation));
      throw mutation;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    createSite,
    error,
    isLoading,
    isMutating,
    mutationError,
    retry: () => setRetryKey((current) => current + 1),
    selectTenant,
    sites,
    tenantId,
    tenants,
    updateSite,
  };
}
