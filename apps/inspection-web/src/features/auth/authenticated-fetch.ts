import { clearAccessToken, getAccessToken } from './auth-storage';

export const sessionExpiredEvent = 'gridassets:session-expired';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const token = getAccessToken();
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) {
    clearAccessToken();
    window.dispatchEvent(new Event(sessionExpiredEvent));
  }

  return response;
}
