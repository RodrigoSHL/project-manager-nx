import { buildLoginUrl, clearAccessToken, getAuthHeaders } from './auth'

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)

  for (const [name, value] of Object.entries(getAuthHeaders())) {
    if (!headers.has(name)) headers.set(name, value)
  }

  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  })

  if (response.status === 401 && typeof window !== 'undefined') {
    clearAccessToken()
    window.location.assign(buildLoginUrl('expired'))
  }

  return response
}
