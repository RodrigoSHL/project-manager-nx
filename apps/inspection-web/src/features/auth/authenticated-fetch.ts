import { clearAccessToken, getAccessToken } from './auth-storage';
import { assertDocumentSession } from './document-session';

export const sessionExpiredEvent = 'gridassets:session-expired';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  assertDocumentSession();
  const token = getAccessToken();
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  assertDocumentSession();
  if (response.status === 401 && token === getAccessToken()) {
    clearAccessToken();
    window.dispatchEvent(new Event(sessionExpiredEvent));
  }

  return response;
}
