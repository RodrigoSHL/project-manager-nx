import type { CurrentUser, UserRole } from './models';

const accessTokenKey = 'access_token';

interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  roles?: UserRole[];
  exp?: number;
}

export function getAccessToken() {
  return localStorage.getItem(accessTokenKey);
}

export function setAccessToken(token: string) {
  localStorage.setItem(accessTokenKey, token);
}

export function clearAccessToken() {
  localStorage.removeItem(accessTokenKey);
}

export function getUserFromToken(): CurrentUser | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as JwtPayload;
    if (!payload.sub || !payload.email) return null;
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
  } catch {
    return null;
  }
}

export function isGlobalAdmin(user: CurrentUser | null | undefined) {
  return Boolean(user?.roles.includes('admin'));
}

export function canAccessOperation(user: CurrentUser | null | undefined) {
  return Boolean(
    user?.roles.some((role) => role === 'user' || role === 'admin')
  );
}
