import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { nutritionRequest } from './nutritionApi';
import { testToken } from '../testing/nutrition-fixture';
import { SessionChangedError } from '../features/auth/auth-session';

const path = '/days/2026-10-23/meals/meal/equivalence-suggestions';
const result = {
  status: 'insufficient',
  source: 'saved',
  message: 'Falta una referencia.',
  missingInfo: [],
  suggestions: [],
  basis: {
    mealId: 'meal',
    productId: null,
    dayPlanVersion: 1,
    catalogPlanVersion: 1,
  },
};
beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken('a'));
});
afterEach(() => vi.unstubAllGlobals());
it('parses recommendations as a read response rather than replacing the daily log', async () => {
  const mock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => result });
  vi.stubGlobal('fetch', mock);
  expect(await nutritionRequest(path, 'POST', { useAi: false })).toEqual(
    result
  );
  expect(mock).toHaveBeenCalledWith(
    '/api/macrofit/me' + path,
    expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
    })
  );
  expect(
    new Headers(mock.mock.calls[0][1].headers).get('Authorization')
  ).toContain('Bearer ');
});
it('rejects malformed suggestions and responses from a changed session', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...result, suggestions: [{}] }),
    })
  );
  await expect(nutritionRequest(path, 'POST')).rejects.toThrow(
    'registros válidos'
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      sessionStorage.setItem('macrofit_access_token', testToken('b'));
      return { ok: true, json: async () => result };
    })
  );
  await expect(nutritionRequest(path, 'POST')).rejects.toBeInstanceOf(
    SessionChangedError
  );
});
