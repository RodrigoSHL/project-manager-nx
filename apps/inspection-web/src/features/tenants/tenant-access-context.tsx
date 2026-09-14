import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import type { Tenant } from '../assets/models';
import { useAuth } from '../auth/auth-context';
import { isGlobalAdmin } from '../auth/auth-storage';
import { useOffline } from '../offline/offline-context';
import { localCatalogRepository } from '../../repositories/local-catalog-repository';

type TenantAccessContextValue = {
  administrableTenants: Tenant[];
  canAdministerTenants: boolean;
  canWriteTenant: (tenantId: string) => boolean;
  isLoading: boolean;
};

const TenantAccessContext = createContext<TenantAccessContextValue | null>(
  null
);

export function TenantAccessProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { mode } = useOffline();
  const globalAdmin = isGlobalAdmin(auth.user);
  const [accessibleTenants, setAccessibleTenants] = useState<Tenant[]>([]);
  const [administrableTenants, setAdministrableTenants] = useState<Tenant[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      setAccessibleTenants([]);
      setAdministrableTenants([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    const request =
      mode === 'LOCAL'
        ? localCatalogRepository.listTenants()
        : assetCatalogApi.listTenants(controller.signal);
    request
      .then((tenants) => {
        setAccessibleTenants(tenants);
        setAdministrableTenants(
          globalAdmin
            ? tenants
            : tenants.filter(
                (tenant) => tenant.membershipRole === 'TENANT_ADMIN'
              )
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAccessibleTenants([]);
          setAdministrableTenants([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [auth.status, auth.user?.userId, globalAdmin, mode]);

  const value = useMemo<TenantAccessContextValue>(
    () => ({
      administrableTenants,
      canAdministerTenants:
        mode === 'REMOTE' && (globalAdmin || administrableTenants.length > 0),
      canWriteTenant: (tenantId) => {
        if (globalAdmin) return true;
        const tenant = accessibleTenants.find((item) => item.id === tenantId);
        return Boolean(tenant && tenant.membershipRole !== 'VIEWER');
      },
      isLoading,
    }),
    [accessibleTenants, administrableTenants, globalAdmin, isLoading, mode]
  );

  return (
    <TenantAccessContext.Provider value={value}>
      {children}
    </TenantAccessContext.Provider>
  );
}

export function useTenantAccess() {
  const context = useContext(TenantAccessContext);
  if (!context) {
    throw new Error('useTenantAccess must be used inside TenantAccessProvider');
  }
  return context;
}
