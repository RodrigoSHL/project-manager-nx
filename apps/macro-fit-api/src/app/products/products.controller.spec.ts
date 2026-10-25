import { BadGatewayException } from '@nestjs/common';
import { z } from 'zod';
import {
  productDraftSchema,
  productSearchSchema,
} from '@project-manager/macrofit-contracts';
import { ProductsController } from './products.controller';
import { normalizeSearchProduct, ProductsService } from './products.service';
import { PlateAnalysisService } from '../plate-analysis/plate-analysis.service';

// Frozen contract used by the installed frontend before product previews.
const installedClientSchema = z
  .object({ products: z.array(productDraftSchema).max(12) })
  .strict();
const product = normalizeSearchProduct({
  code: '8431594003245',
  product_name: 'Mayonesa',
  brands: ['Marca'],
  quantity: '350 g',
  nutriments: { proteins_100g: 0, carbohydrates_100g: 6.67, fat_100g: 34.7 },
})!;

describe('Product search compatibility', () => {
  const cached = { products: [product] };
  const search = jest.fn().mockResolvedValue(cached);
  const searchProductsWeb = jest.fn().mockResolvedValue({ products: [] });
  const controller = new ProductsController(
    {
      search,
    } as unknown as ProductsService,
    { searchProductsWeb } as unknown as PlateAnalysisService
  );
  beforeEach(() => {
    search.mockClear();
    searchProductsWeb.mockClear();
  });

  it.each([
    null,
    {},
    { query: 'a' },
    { query: 9 },
    { query: 'a'.repeat(101) },
    { query: 'mostaza', url: 'https://example.com' },
  ])('validates a web query %j before the paid call', (body) => {
    expect(() => controller.searchWeb(body)).toThrow();
    expect(searchProductsWeb).not.toHaveBeenCalled();
  });
  it('trims a valid web search query', async () => {
    await controller.searchWeb({ query: ' Mostaza Heinz ' });
    expect(searchProductsWeb).toHaveBeenCalledWith('Mostaza Heinz');
  });

  it('reproduces the installed client failure and keeps default searches compatible without changing the cache', async () => {
    expect(installedClientSchema.safeParse(cached).success).toBe(false);
    const legacy = await controller.search('mayonesa');
    expect(installedClientSchema.parse(legacy).products[0]).toMatchObject({
      name: 'Mayonesa',
      protein: 0,
      calories: null,
      referenceUnit: null,
    });
    expect(legacy.products[0]).not.toHaveProperty('preview');
    const rich = await controller.search('mayonesa', 'preview');
    expect(productSearchSchema.parse(rich).products[0].preview?.quantity).toBe(
      '350 g'
    );
    expect(cached.products[0].preview).toEqual(product.preview);
    expect(await controller.search('mayonesa')).toEqual(legacy);
  });
  it.each(['full', ['preview', 'preview'], null, true, {}])(
    'rejects an unsupported view %j before querying',
    async (view) => {
      await expect(controller.search('mayonesa', view)).rejects.toMatchObject({
        status: 400,
      });
      expect(search).not.toHaveBeenCalled();
    }
  );
  it('preserves upstream failures instead of returning an empty success', async () => {
    search.mockRejectedValueOnce(new BadGatewayException('Respuesta inválida'));
    await expect(controller.search('mayonesa')).rejects.toMatchObject({
      status: 502,
    });
  });
});
