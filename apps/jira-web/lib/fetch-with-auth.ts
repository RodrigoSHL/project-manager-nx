const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = { ...init, credentials: 'include' };
  const res = await fetch(input, opts);

  if (res.status !== 401) return res;

  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!refreshRes.ok) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return res;
  }

  return fetch(input, opts);
}
