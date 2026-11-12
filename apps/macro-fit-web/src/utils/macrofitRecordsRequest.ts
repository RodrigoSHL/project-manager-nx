import {
  authenticatedFetch,
  getAccessToken,
  SessionChangedError,
} from '../features/auth/auth-session';
function responseError(status: number) {
  const code = `HTTP ${status}`;
  if (status === 504 || status === 524)
    return `El servidor tardó demasiado en responder (${code}). Vuelve a intentarlo en unos momentos.`;
  if (status === 429)
    return `Hay demasiadas solicitudes (${code}). Espera un momento y vuelve a intentarlo.`;
  if (status === 502 || status === 503)
    return `El servicio no está disponible temporalmente (${code}). Vuelve a intentarlo en unos momentos.`;
  if (status === 403)
    return `La solicitud fue rechazada (${code}). Vuelve a cargar la aplicación e inténtalo nuevamente.`;
  return `No se pudo leer una respuesta válida del servidor (${code}). Vuelve a cargar la aplicación e inténtalo nuevamente.`;
}

export async function macrofitRecordsRequest(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<unknown> {
  const token = getAccessToken();
  const response = await authenticatedFetch(`/api/macrofit/me${path}`, {
    method,
    cache: 'no-store',
    signal: signal ?? AbortSignal.timeout(20000),
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
        }
      : {}),
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch (failure) {
    if (token !== getAccessToken()) throw new SessionChangedError();
    // Cancellation and the request deadline are handled by the caller. A proxy
    // HTML page must never replace their meaning with a JSON syntax error.
    if (
      failure !== null &&
      typeof failure === 'object' &&
      'name' in failure &&
      ['AbortError', 'TimeoutError'].includes(String(failure.name))
    )
      throw failure;
    throw new Error(responseError(response.status));
  }
  if (token !== getAccessToken()) throw new SessionChangedError();
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? data.message
        : null;
    throw new Error(
      typeof message === 'string' && message.trim()
        ? message
        : Array.isArray(message) &&
          message.length > 0 &&
          message.every((item) => typeof item === 'string')
        ? message.join('. ')
        : responseError(response.status)
    );
  }
  return data;
}
