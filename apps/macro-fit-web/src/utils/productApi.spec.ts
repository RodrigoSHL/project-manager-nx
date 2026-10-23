import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readProductLabel, searchProducts } from './productApi';
import { testToken } from '../testing/nutrition-fixture';
import { SessionChangedError } from '../features/auth/auth-session';

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken('products-a'));
});
afterEach(() => {
  vi.unstubAllGlobals();
});
it('rejects responses from a previous session before returning product data', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      sessionStorage.setItem('macrofit_access_token', testToken('products-b'));
      return { ok: true, json: async () => ({ products: [] }) };
    })
  );
  await expect(
    searchProducts('Yogur', new AbortController().signal)
  ).rejects.toBeInstanceOf(SessionChangedError);
});
it('does not accept an invalid import payload as a product', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ products: [{ name: 'Inventado' }] }),
    }))
  );
  await expect(
    searchProducts('Yogur', new AbortController().signal)
  ).rejects.toThrow('datos inválidos');
});
it('rejects unsupported or oversized labels before transmitting any photo', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  for (const file of [
    new File(['label'], 'label.txt', { type: 'text/plain' }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'label.jpg', {
      type: 'image/jpeg',
    }),
  ]) {
    await expect(
      readProductLabel(file, new AbortController().signal)
    ).rejects.toThrow('hasta 5 MB');
  }
  expect(fetch).not.toHaveBeenCalled();
});
