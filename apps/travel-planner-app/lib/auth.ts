export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const encodedPayload = token.split('.')[1];
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as {
      sub?: string;
      email?: string;
      name?: string;
    };

    if (!payload.sub || !payload.email) return null;
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}
