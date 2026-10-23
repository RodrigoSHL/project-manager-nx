export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
}

export const TOKEN_KEY = 'access_token';
export const SESSION_CHANGED = 'macrofit:session-changed';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function tokenExpiresAt(token: string): number | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      atob(part.padEnd(Math.ceil(part.length / 4) * 4, '='))
    );
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function validUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<CurrentUser>;
  return (
    typeof user.userId === 'string' &&
    Boolean(user.userId) &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string')
  );
}

export class SessionChangedError extends Error {
  constructor() {
    super('La sesión cambió. Repite la operación con tu cuenta actual.');
  }
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  if (!token || (tokenExpiresAt(token) ?? 0) <= Date.now()) {
    if (token === getAccessToken()) setAccessToken(null);
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  if (token !== getAccessToken()) throw new SessionChangedError();
  if (response.status === 401) setAccessToken(null);
  return response;
}
