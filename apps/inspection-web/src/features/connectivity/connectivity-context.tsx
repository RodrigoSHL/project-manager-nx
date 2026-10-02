import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { checkApiReachability } from '../../services/connectivity-service';
import type { ConnectivityContextState } from './models';

const healthIntervalMs = 30_000;

const ConnectivityContext = createContext<ConnectivityContextState | null>(
  null
);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({
    browserOnline: navigator.onLine,
    apiReachable: false,
    checking: navigator.onLine,
    lastCheckedAt: null as string | null,
  }));
  const checkingRef = useRef(false);

  const refresh = useCallback(async () => {
    const browserOnline = navigator.onLine;
    if (!browserOnline) {
      checkingRef.current = false;
      setState({
        browserOnline: false,
        apiReachable: false,
        checking: false,
        lastCheckedAt: new Date().toISOString(),
      });
      return;
    }
    if (checkingRef.current) return;
    checkingRef.current = true;
    setState((current) => ({
      ...current,
      browserOnline: true,
      checking: true,
    }));
    const apiReachable = await checkApiReachability();
    checkingRef.current = false;
    setState({
      browserOnline: navigator.onLine,
      apiReachable: navigator.onLine && apiReachable,
      checking: false,
      lastCheckedAt: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setState({
        browserOnline: false,
        apiReachable: false,
        checking: false,
        lastCheckedAt: new Date().toISOString(),
      });
    };
    const handleOnline = () => void refresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void refresh();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, healthIntervalMs);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [refresh, state]);
  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivityContext() {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity requiere ConnectivityProvider.');
  }
  return context;
}
