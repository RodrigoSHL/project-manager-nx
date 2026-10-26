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

it.each([
  [403, 'solicitud fue rechazada'],
  [429, 'demasiadas solicitudes'],
  [502, 'no está disponible temporalmente'],
  [503, 'no está disponible temporalmente'],
  [504, 'tardó demasiado'],
  [524, 'tardó demasiado'],
  [200, 'respuesta válida'],
])(
  'reports an HTML HTTP %s response without exposing its body or retrying',
  async (status, message) => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('<!DOCTYPE html><title>Proxy page</title>', {
        status,
        headers: { 'Content-Type': 'text/html' },
      })
    );
    vi.stubGlobal('fetch', fetch);
    const request = nutritionRequest(
      '/foods/chocolate/equivalence-suggestions',
      'POST',
      {
        catalogPlanVersion: 19,
        useAi: true,
        mode: 'estimate',
      }
    );
    await expect(request).rejects.toThrow(message);
    await expect(request).rejects.toThrow(`HTTP ${status}`);
    await expect(request).rejects.not.toThrow(
      /DOCTYPE|Unexpected token|Proxy page/
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const headers = new Headers(fetch.mock.calls[0][1].headers);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
  }
);

it('preserves meaningful JSON errors from the API', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Tu pauta cambió. Actualiza tus productos.',
        }),
        { status: 409 }
      )
    )
  );
  await expect(nutritionRequest(path, 'POST')).rejects.toThrow(
    'Tu pauta cambió'
  );
});

it.each(['AbortError', 'TimeoutError'])(
  'preserves %s while reading the response',
  async (name) => {
    const failure = new DOMException('Request cancelled', name);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => {
          throw failure;
        },
      })
    );
    await expect(nutritionRequest(path, 'POST')).rejects.toBe(failure);
  }
);

it('discards an HTML response if the user session changes during its body read', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 502,
      ok: false,
      json: async () => {
        sessionStorage.setItem('macrofit_access_token', testToken('b'));
        throw new SyntaxError('Unexpected token <');
      },
    })
  );
  await expect(nutritionRequest(path, 'POST')).rejects.toBeInstanceOf(
    SessionChangedError
  );
});
