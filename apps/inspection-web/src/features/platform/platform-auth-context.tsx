import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PlatformSession } from './models';
import { platformAuthApi, PlatformApiError } from './platform-api';

const sessionKey = 'gridassets.platform.session';

type PlatformAuthValue = {
  session: PlatformSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const PlatformAuthContext = createContext<PlatformAuthValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlatformSession | null>(readSession);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await platformAuthApi.login(email, password);
    if (!nextSession.user.roles.includes('admin')) {
      throw new PlatformApiError(
        'Tu cuenta no tiene permisos de administración de plataforma.',
        403
      );
    }
    sessionStorage.setItem(sessionKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(sessionKey);
    setSession(null);
  }, []);

  const value = useMemo<PlatformAuthValue>(
    () => ({ session, isAuthenticated: session !== null, login, logout }),
    [login, logout, session]
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth must be used inside PlatformAuthProvider');
  }
  return context;
}

function readSession(): PlatformSession | null {
  try {
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlatformSession;
    if (
      !parsed.accessToken ||
      !parsed.user?.roles?.includes('admin') ||
      !parsed.user.email
    ) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(sessionKey);
    return null;
  }
}
