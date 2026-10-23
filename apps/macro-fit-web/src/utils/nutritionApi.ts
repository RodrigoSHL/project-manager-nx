import {
  authenticatedFetch,
  getAccessToken,
  SessionChangedError,
} from '../features/auth/auth-session';
import { dailyLogSchema, nutritionAccountSchema } from '../types/nutrition';

export async function nutritionRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const token = getAccessToken();
  const response = await authenticatedFetch(`/api/macrofit/me${path}`, {
    method,
    cache: 'no-store',
    signal: signal ?? AbortSignal.timeout(20000),
    ...(body !== undefined
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (token !== getAccessToken()) throw new SessionChangedError();
  if (!response.ok)
    throw new Error(
      typeof data?.message === 'string'
        ? data.message
        : 'No se pudo guardar el registro.'
    );
  const parsed = (
    path.startsWith('/days/') ? dailyLogSchema : nutritionAccountSchema
  ).safeParse(data);
  if (!parsed.success)
    throw new Error('El servidor no entregó registros válidos.');
  return parsed.data as T;
}
