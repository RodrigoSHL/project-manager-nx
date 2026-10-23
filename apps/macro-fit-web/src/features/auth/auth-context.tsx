import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CurrentUser,
  getAccessToken,
  SESSION_CHANGED,
  setAccessToken,
  TOKEN_KEY,
  tokenExpiresAt,
  validUser,
} from './auth-session';

type AuthState = {
  status: 'checking' | 'anonymous' | 'unavailable' | 'authenticated';
  user: CurrentUser | null;
  token: string | null;
};
const anonymous: AuthState = { status: 'anonymous', user: null, token: null };
const AuthContext = createContext<
  | (AuthState & {
      login: (email: string, password: string) => Promise<void>;
      logout: () => void;
      retry: () => void;
      error: string | null;
    })
  | null
>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...anonymous,
    status: 'checking',
  });
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef(0);
  const logout = useCallback(() => {
    attempt.current++;
    setAccessToken(null);
    setState(anonymous);
  }, []);

  useEffect(() => {
    const sync = () => {
      attempt.current++;
      setState({ ...anonymous, status: 'checking' });
      setRevision((value) => value + 1);
    };
    const storage = (event: StorageEvent) => {
      if (
        (!event.storageArea || event.storageArea === sessionStorage) &&
        (event.key === TOKEN_KEY || event.key === null)
      )
        sync();
    };
    window.addEventListener(SESSION_CHANGED, sync);
    window.addEventListener('storage', storage);
    return () => {
      attempt.current++;
      window.removeEventListener(SESSION_CHANGED, sync);
      window.removeEventListener('storage', storage);
    };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    const version = ++attempt.current;
    const controller = new AbortController();
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expiresAt = token ? tokenExpiresAt(token) : null;
    if (!token || !expiresAt || expiresAt <= Date.now()) {
      if (token) setAccessToken(null);
      setState(anonymous);
      return;
    }
    setState({ ...anonymous, status: 'checking' });
    setError(null);
    const expire = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        if (getAccessToken() === token) {
          setError('Tu sesión expiró. Inicia sesión nuevamente.');
          logout();
        }
      } else timer = setTimeout(expire, Math.min(remaining, 2147483647));
    };
    expire();
    const requestTimer = setTimeout(() => controller.abort(), 15000);
    void (async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (
          disposed ||
          version !== attempt.current ||
          getAccessToken() !== token
        )
          return;
        if (controller.signal.aborted) throw new Error('Profile timeout');
        if (response.status === 401) {
          setError('Tu sesión expiró. Inicia sesión nuevamente.');
          logout();
          return;
        }
        if (!response.ok) throw new Error('No fue posible validar tu sesión.');
        const user: unknown = await response.json();
        if (
          disposed ||
          version !== attempt.current ||
          getAccessToken() !== token
        )
          return;
        if (controller.signal.aborted) throw new Error('Profile timeout');
        if (!validUser(user))
          throw new Error('El servidor no entregó un perfil válido.');
        setState({ status: 'authenticated', user, token });
      } catch {
        if (
          !disposed &&
          version === attempt.current &&
          getAccessToken() === token
        ) {
          setError(
            'No se pudo validar la sesión. Comprueba tu conexión y reintenta.'
          );
          setState({ status: 'unavailable', user: null, token });
        }
      } finally {
        clearTimeout(requestTimer);
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      clearTimeout(requestTimer);
    };
  }, [revision, logout]);

  const login = async (email: string, password: string) => {
    const version = ++attempt.current;
    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        'No se pudo conectar con el servidor. Intenta nuevamente.'
      );
    }
    if (version !== attempt.current)
      throw new Error('La sesión cambió. Intenta nuevamente.');
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? 'Correo o contraseña incorrectos.'
          : 'No fue posible iniciar sesión. Intenta nuevamente.'
      );
    const data = await response.json();
    if (version !== attempt.current)
      throw new Error('La sesión cambió. Intenta nuevamente.');
    if (
      typeof data.access_token !== 'string' ||
      !validUser(data.user) ||
      (tokenExpiresAt(data.access_token) ?? 0) <= Date.now()
    )
      throw new Error('El servidor no entregó una sesión válida.');
    setError(null);
    // The session-change listener validates /profile before any account data is mounted.
    setAccessToken(data.access_token);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        retry: () => setRevision((value) => value + 1),
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider');
  return context;
}
