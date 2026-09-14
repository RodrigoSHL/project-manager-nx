import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cacheSiteForOffline } from '../../services/cache-site-for-offline';
import { offlineRepository } from '../../repositories/offline-repository';
import type { DataSourceMode, OfflineSiteRecord } from './models';

const modeKey = 'inspection-data-source';

type OfflineContextValue = {
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  offlineSites: OfflineSiteRecord[];
  refresh: () => Promise<void>;
  cacheSite: (tenantId: string, siteId: string) => Promise<void>;
  clearLocalData: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataSourceMode>(() =>
    localStorage.getItem(modeKey) === 'LOCAL' ? 'LOCAL' : 'REMOTE'
  );
  const [offlineSites, setOfflineSites] = useState<OfflineSiteRecord[]>([]);
  const refresh = useCallback(
    async () => setOfflineSites(await offlineRepository.listSites()),
    []
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const setMode = useCallback((next: DataSourceMode) => {
    localStorage.setItem(modeKey, next);
    setModeState(next);
  }, []);
  const cacheSite = useCallback(
    async (tenantId: string, siteId: string) => {
      try {
        await cacheSiteForOffline(tenantId, siteId);
      } finally {
        await refresh();
      }
    },
    [refresh]
  );
  const clearLocalData = useCallback(async () => {
    await offlineRepository.clear();
    setMode('REMOTE');
    await refresh();
  }, [refresh, setMode]);
  const value = useMemo(
    () => ({ mode, setMode, offlineSites, refresh, cacheSite, clearLocalData }),
    [cacheSite, clearLocalData, mode, offlineSites, refresh, setMode]
  );
  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline() {
  const value = useContext(OfflineContext);
  if (!value) throw new Error('useOffline requiere OfflineProvider.');
  return value;
}
