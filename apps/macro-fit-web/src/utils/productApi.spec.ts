import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readProductLabel, searchProducts } from './productApi';
import { testToken } from '../testing/nutrition-fixture';
import { SessionChangedError } from '../features/auth/auth-session';
import { ProductSearchItem } from '../types/nutrition';

const product: ProductSearchItem = {
  name: 'Mayonesa',
  brand: 'Marca',
  barcode: '8431594003245',
  referenceAmount: 100,
  referenceUnit: null,
  calories: null,
  protein: 0,
  carbs: 6.67,
  fat: 34.7,
  fiber: null,
  warnings: [],
  source: { kind: 'open_food_facts' },
  preview: {
    description: null,
    quantity: '350 g',
    categories: [],
    imageUrl: null,
  },
};

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
it('requests the preview representation and ignores additive metadata while validating known data', async () => {
  const fetch = vi.fn(async (_path: string) => ({
    ok: true,
    json: async () => ({
      products: [
        {
          ...product,
          futureField: 'extra',
          preview: { ...product.preview, futureField: 'extra' },
        },
      ],
      total: 1,
    }),
  }));
  vi.stubGlobal('fetch', fetch);
  const results = await searchProducts(
    'Mayonesa Kraft',
    new AbortController().signal
  );
  expect(fetch.mock.calls[0][0]).toBe(
    '/api/macrofit/products/search?q=Mayonesa%20Kraft&view=preview'
  );
  expect(results).toEqual([product]);
  expect(results[0]).not.toHaveProperty('futureField');
});
it('accepts the original search representation during a rolling deployment', async () => {
  const { preview: _preview, ...legacy } = product;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ products: [legacy] }),
    }))
  );
  expect(
    await searchProducts('mayonesa', new AbortController().signal)
  ).toEqual([legacy]);
});
it.each([
  { protein: -1 },
  { referenceUnit: 'oz' },
  { preview: { ...product.preview, imageUrl: 'https://evil.test/image.jpg' } },
])('still rejects invalid known fields %j', async (invalid) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ products: [{ ...product, ...invalid }] }),
    }))
  );
  await expect(
    searchProducts('mayonesa', new AbortController().signal)
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
