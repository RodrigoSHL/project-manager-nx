import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, AuthApiError } from './auth-api';
import {
  clearAccessToken,
  getAccessToken,
  getUserFromToken,
  setAccessToken,
  canAccessOperation,
} from './auth-storage';
import { documentAccountId, invalidateDocumentSession } from './document-session';
import { inspectionDb } from '../../db/inspection-db';
import { sessionExpiredEvent } from './authenticated-fetch';
import type { CurrentUser } from './models';
import { useConnectivity } from '../../hooks/use-connectivity';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

type AuthContextValue = {
  accessToken: string | null;
  user: CurrentUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { apiReachable } = useConnectivity();
  const [user, setUser] = useState<CurrentUser | null>(getUserFromToken);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [verificationKey, setVerificationKey] = useState(0);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setStatus('anonymous');
    if (documentAccountId !== null) {
      invalidateDocumentSession();
      inspectionDb.close();
      window.location.replace('/login');
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !getUserFromToken()) {
      clearSession();
      return;
    }

    if (!apiReachable) {
      setUser(getUserFromToken());
      setStatus('authenticated');
      return;
    }

    let cancelled = false;
    setStatus('checking');
    authApi
      .profile(token)
      .then((profile) => {
        if (cancelled || token !== getAccessToken()) return;
        setUser(profile);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (cancelled || token !== getAccessToken()) return;
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          error.status === 401
        ) {
          clearSession();
        } else {
          setStatus('unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiReachable, clearSession, verificationKey]);

  useEffect(() => {
    window.addEventListener(sessionExpiredEvent, clearSession);
    return () => window.removeEventListener(sessionExpiredEvent, clearSession);
  }, [clearSession]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'access_token' && event.key !== null) return;
      if ((getUserFromToken()?.userId ?? null) !== documentAccountId) {
        invalidateDocumentSession();
        inspectionDb.close();
        setUser(null);
        setStatus('checking');
        window.location.reload();
      } else {
        setVerificationKey((current) => current + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const previousToken = getAccessToken();
    const session = await authApi.login(email, password);
    if (previousToken !== getAccessToken()) {
      throw new AuthApiError('La sesión cambió durante el inicio de sesión.');
    }
    if (!canAccessOperation(session.user)) {
      throw new AuthApiError('Tu cuenta no tiene permisos para ingresar a GridAssets.');
    }
    setAccessToken(session.accessToken);
    invalidateDocumentSession();
    inspectionDb.close();
    // LoginPage starts a fresh document before mounting authenticated providers.
    return session.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: getAccessToken(),
      user,
      status,
      login,
      logout: clearSession,
      retry: () => setVerificationKey((current) => current + 1),
    }),
    [clearSession, login, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
