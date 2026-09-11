import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from './auth-api';
import {
  clearAccessToken,
  getAccessToken,
  getUserFromToken,
  setAccessToken,
} from './auth-storage';
import { sessionExpiredEvent } from './authenticated-fetch';
import type { CurrentUser } from './models';

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
  const [user, setUser] = useState<CurrentUser | null>(getUserFromToken);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [verificationKey, setVerificationKey] = useState(0);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !getUserFromToken()) {
      clearSession();
      return;
    }

    let cancelled = false;
    setStatus('checking');
    authApi
      .profile(token)
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
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
  }, [clearSession, verificationKey]);

  useEffect(() => {
    window.addEventListener(sessionExpiredEvent, clearSession);
    return () => window.removeEventListener(sessionExpiredEvent, clearSession);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
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
