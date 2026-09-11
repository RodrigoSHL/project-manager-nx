import { useEffect, useMemo } from 'react';
import { useWorkCatalogStore } from './work-catalog-context';

export function useWorkCatalog(tenantId: string) {
  const store = useWorkCatalogStore();

  useEffect(() => {
    void store.ensureTenant(tenantId);
  }, [store.ensureTenant, tenantId]);

  return useMemo(
    () => ({
      works: store.works.filter((item) => item.tenantId === tenantId),
      responses: store.responses.filter((item) => item.tenantId === tenantId),
      taskCompletions: store.taskCompletions.filter(
        (item) => item.tenantId === tenantId
      ),
      annotations: store.annotations.filter(
        (item) => item.tenantId === tenantId
      ),
      snapshots: store.snapshots.filter((item) => item.tenantId === tenantId),
      catalog: store.catalogs[tenantId],
      isLoading: store.loadingTenantIds.includes(tenantId),
      isMutating: store.mutatingTenantIds.includes(tenantId),
      error: store.errors[tenantId] ?? null,
      retry: () => store.retryTenant(tenantId),
      createWork: store.createWork,
      saveResponses: store.saveResponses,
      startWork: store.startWork,
      finishWork: store.finishWork,
    }),
    [store, tenantId]
  );
}
