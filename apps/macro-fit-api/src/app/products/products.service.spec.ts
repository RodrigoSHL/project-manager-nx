import { normalizeProduct, ProductsService } from './products.service';

const product = {
  code: '7801234567890',
  product_name: 'Yogur',
  brands: 'Marca',
  product_quantity_unit: 'g',
  nutriments: {
    'energy-kcal_100g': 72,
    proteins_100g: 8,
    carbohydrates_100g: 0,
    fat_100g: 3,
  },
};
describe('Personal product imports', () => {
  let upstream: jest.SpyInstance;
  beforeEach(() => {
    upstream = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => upstream.mockRestore());
  it('preserves declared calories and zero, leaving missing nutrients unknown', () => {
    expect(normalizeProduct(product)).toMatchObject({
      calories: 72,
      protein: 8,
      carbs: 0,
      fiber: null,
      referenceAmount: 100,
      referenceUnit: 'g',
      source: {
        kind: 'open_food_facts',
        url: 'https://world.openfoodfacts.org/product/7801234567890',
      },
    });
  });
  it('does not mix serving, prepared, estimated or kJ values into the base', () => {
    expect(
      normalizeProduct({
        ...product,
        nutriments: {
          energy_100g: 900,
          proteins_serving: 8,
          fat_prepared_100g: 3,
          carbohydrates_100g: '4',
        },
      })
    ).toMatchObject({ calories: null, protein: null, carbs: null, fat: null });
  });
  it('uses explicit volume units and leaves ambiguous units unselected', () => {
    expect(
      normalizeProduct({ ...product, product_quantity_unit: 'ml' })
        ?.referenceUnit
    ).toBe('ml');
    expect(
      normalizeProduct({ ...product, product_quantity_unit: undefined })
        ?.referenceUnit
    ).toBeNull();
    expect(
      normalizeProduct({ ...product, serving_quantity_unit: 'ml' })
        ?.referenceUnit
    ).toBeNull();
  });
  it('rejects invalid codes and does not turn inequalities or invalid values into zeros', () => {
    expect(normalizeProduct({ ...product, code: '../secret' })).toBeNull();
    expect(
      normalizeProduct({
        ...product,
        nutriments: {
          proteins_100g: -1,
          fat_100g: Infinity,
          carbohydrates_100g: 1,
          carbohydrates_modifier: '<',
        },
      })
    ).toMatchObject({ protein: null, fat: null, carbs: null });
  });
  it('requests a bounded name search with attribution and reuses its cache', async () => {
    upstream.mockResolvedValue(
      new Response(JSON.stringify({ hits: [product] }))
    );
    const service = new ProductsService();
    const result = await service.search('Mayonesa & Kraft');
    expect(result.products).toHaveLength(1);
    const [url, init] = upstream.mock.calls[0];
    expect(url.origin).toBe('https://search.openfoodfacts.org');
    expect(url.searchParams.get('q')).toBe('Mayonesa Kraft');
    expect(url.searchParams.get('page_size')).toBe('12');
    expect(init.headers['User-Agent']).toContain('MacroFit');
    expect(init.redirect).toBe('error');
    expect(await service.search('mayonesa & kraft')).toEqual(result);
    expect(upstream).toHaveBeenCalledTimes(1);
  });
  it('looks up barcodes and represents not found as an empty result', async () => {
    upstream.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 1, product }))
    );
    upstream.mockResolvedValueOnce(new Response('{}', { status: 404 }));
    const service = new ProductsService();
    expect((await service.search(product.code)).products).toHaveLength(1);
    expect(upstream.mock.calls[0][0].pathname).toBe(
      '/api/v2/product/7801234567890.json'
    );
    expect(await service.search('7801234567891')).toEqual({ products: [] });
  });
  it.each([null, ['query'], '', 'x', 'x'.repeat(101)])(
    'rejects invalid queries %j before fetching',
    async (query) => {
      await expect(new ProductsService().search(query)).rejects.toMatchObject({
        status: 400,
      });
      expect(upstream).not.toHaveBeenCalled();
    }
  );
  it('enforces an IP budget across distinct searches', async () => {
    upstream.mockImplementation(async () => new Response('{"hits":[]}'));
    const service = new ProductsService();
    for (let i = 0; i < 8; i++) await service.search(`product ${i}`);
    await expect(service.search('product nine')).rejects.toMatchObject({
      status: 429,
    });
    expect(upstream).toHaveBeenCalledTimes(8);
  });
  it('coalesces identical simultaneous requests', async () => {
    let finish!: (response: Response) => void;
    upstream.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const service = new ProductsService();
    const a = service.search('same');
    const b = service.search('same');
    finish(new Response('{"hits":[]}'));
    expect(await a).toEqual(await b);
    expect(upstream).toHaveBeenCalledTimes(1);
  });
  it.each([429, 500, 503])(
    'surfaces upstream %s instead of inventing a product',
    async (status) => {
      upstream.mockResolvedValue(new Response('{}', { status }));
      await expect(
        new ProductsService().search('unknown')
      ).rejects.toMatchObject({ status: 503 });
    }
  );
  it('distinguishes malformed data and deadlines from not found', async () => {
    upstream.mockResolvedValueOnce(new Response('{invalid'));
    await expect(new ProductsService().search('unknown')).rejects.toMatchObject(
      { status: 502 }
    );
    upstream.mockRejectedValueOnce(
      new DOMException('deadline', 'TimeoutError')
    );
    await expect(new ProductsService().search('unknown')).rejects.toMatchObject(
      { status: 504 }
    );
  });
});
