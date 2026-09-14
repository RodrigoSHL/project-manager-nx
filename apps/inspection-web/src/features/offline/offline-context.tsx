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
import {
  resolveDataSourceMode,
  type DataSourceMode,
  type OfflineSiteRecord,
} from './models';
import type { PendingSyncSummary } from './models';
import { useConnectivity } from '../../hooks/use-connectivity';

const modeKey = 'inspection-data-source';

const emptyPendingSummary: PendingSyncSummary = {
  total: 0,
  localOnly: 0,
  modified: 0,
  newWorks: 0,
  modifiedWorks: 0,
  responses: 0,
  taskCompletions: 0,
  annotations: 0,
  items: [],
};

type OfflineContextValue = {
  mode: DataSourceMode;
  preferredMode: DataSourceMode;
  isForcedOffline: boolean;
  setMode: (mode: DataSourceMode) => void;
  offlineSites: OfflineSiteRecord[];
  pendingSummary: PendingSyncSummary;
  refresh: () => Promise<void>;
  cacheSite: (tenantId: string, siteId: string) => Promise<void>;
  clearLocalData: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const connectivity = useConnectivity();
  const [preferredMode, setPreferredMode] = useState<DataSourceMode>(() =>
    localStorage.getItem(modeKey) === 'LOCAL' ? 'LOCAL' : 'REMOTE'
  );
  const mode = resolveDataSourceMode(preferredMode, connectivity.apiReachable);
  const isForcedOffline = !connectivity.apiReachable;
  const [offlineSites, setOfflineSites] = useState<OfflineSiteRecord[]>([]);
  const [pendingSummary, setPendingSummary] = useState(emptyPendingSummary);
  const refresh = useCallback(async () => {
    const [sites, pending] = await Promise.all([
      offlineRepository.listSites(),
      offlineRepository.getPendingSummary(),
    ]);
    setOfflineSites(sites);
    setPendingSummary(pending);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const setMode = useCallback((next: DataSourceMode) => {
    localStorage.setItem(modeKey, next);
    setPreferredMode(next);
  }, []);
  const cacheSite = useCallback(
    async (tenantId: string, siteId: string) => {
      if (!connectivity.apiReachable) {
        throw new Error('El servidor no está disponible para descargar datos.');
      }
      try {
        await cacheSiteForOffline(tenantId, siteId);
      } finally {
        await refresh();
      }
    },
    [connectivity.apiReachable, refresh]
  );
  const clearLocalData = useCallback(async () => {
    await offlineRepository.clear();
    setMode('REMOTE');
    await refresh();
  }, [refresh, setMode]);
  const value = useMemo(
    () => ({
      mode,
      preferredMode,
      isForcedOffline,
      setMode,
      offlineSites,
      pendingSummary,
      refresh,
      cacheSite,
      clearLocalData,
    }),
    [
      cacheSite,
      clearLocalData,
      isForcedOffline,
      mode,
      offlineSites,
      pendingSummary,
      preferredMode,
      refresh,
      setMode,
    ]
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
