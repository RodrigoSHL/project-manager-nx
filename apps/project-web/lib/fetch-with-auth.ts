/**
 * fetchWithAuth — wraps fetch to:
 * 1. Always send credentials (HttpOnly cookies)
 * 2. On 401: attempt a silent token refresh, then retry once
 * 3. On second 401: redirect to /login
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = { ...init, credentials: 'include' };

  const res = await fetch(input, opts);

  if (res.status !== 401) return res;

  // Try refresh
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!refreshRes.ok) {
    // Refresh failed — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return res;
  }

  // Retry original request with fresh cookie
  return fetch(input, opts);
}
