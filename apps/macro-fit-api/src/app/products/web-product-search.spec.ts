import { type GenerateContentResponse } from '@google/genai';
import { parseWebProducts } from './web-product-search';

const product = {
  name: 'Mostaza Heinz',
  brand: 'Heinz',
  barcode: null,
  referenceAmount: 100,
  referenceUnit: 'g',
  calories: 54,
  protein: 3.5,
  carbs: 6,
  fat: 1.8,
  fiber: null,
  warnings: [],
};
function grounded(products = [product]) {
  const text = JSON.stringify({ products });
  return {
    text,
    candidates: [
      {
        groundingMetadata: {
          webSearchQueries: ['mostaza Heinz tabla nutricional'],
          groundingChunks: [
            {
              web: { title: 'Fabricante', uri: 'https://example.com/mostaza' },
            },
          ],
          groundingSupports: [
            {
              segment: {
                text,
                startIndex: 0,
                endIndex: Buffer.byteLength(text),
              },
              groundingChunkIndices: [0],
            },
          ],
          searchEntryPoint: { renderedContent: '<div>Google Search</div>' },
        },
      },
    ],
  } as GenerateContentResponse;
}

describe('Grounded product search', () => {
  it('keeps published values and source citations, including declared zeros', () => {
    const result = parseWebProducts(grounded([{ ...product, carbs: 0 }]));
    expect(result.products[0]).toMatchObject({
      name: product.name,
      carbs: 0,
      fiber: null,
      source: {
        kind: 'web_search',
        sources: [{ title: 'Fabricante', url: 'https://example.com/mostaza' }],
      },
    });
    expect(result.searchSuggestions).toContain('Google Search');
  });
  it('rejects a response from model memory without an actual search', () => {
    const response = grounded();
    response.candidates![0].groundingMetadata!.webSearchQueries = [];
    expect(() => parseWebProducts(response)).toThrow(
      'no confirmó una búsqueda'
    );
  });
  it('does not accept fabricated citations, missing support or unsafe source links', () => {
    for (const url of [
      'not-a-url',
      'javascript:alert(1)',
      'https://user:password@example.com/page',
    ]) {
      const response = grounded();
      response.candidates![0].groundingMetadata!.groundingChunks![0].web!.uri =
        url;
      expect(parseWebProducts(response).products).toEqual([]);
    }
    const response = grounded();
    response.candidates![0].groundingMetadata!.groundingSupports = [];
    expect(parseWebProducts(response).products).toEqual([]);
  });
  it('keeps a product identity but clears nutrients without their own supporting citation', () => {
    const response = grounded();
    response.candidates![0].groundingMetadata!.groundingSupports![0].segment!.text =
      '"Mostaza Heinz"';
    const result = parseWebProducts(response).products[0];
    expect(result.name).toBe(product.name);
    expect(result.referenceAmount).toBeNull();
    expect(result.referenceUnit).toBeNull();
    expect(result.calories).toBeNull();
    expect(result.brand).toBeNull();
  });
  it('does not transfer a citation between products, including names with escaped quotes', () => {
    const second = { ...product, name: 'Mostaza "especial"', calories: 80 };
    const response = grounded([product, second]);
    response.candidates![0].groundingMetadata!.groundingSupports![0].segment!.text =
      JSON.stringify(second);
    const result = parseWebProducts(response);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      name: second.name,
      calories: 80,
    });
  });
  it('does not retain macros when the serving base is unsupported', () => {
    const response = grounded();
    response.candidates![0].groundingMetadata!.groundingSupports = [
      '"Mostaza Heinz"',
      '54',
      '3.5',
      '6',
      '1.8',
    ].map((text) => ({ segment: { text }, groundingChunkIndices: [0] }));
    expect(parseWebProducts(response).products[0].calories).toBeNull();
  });
  it('does not retain a value when its citation exceeds the saved source limit', () => {
    const response = grounded();
    const metadata = response.candidates![0].groundingMetadata!;
    metadata.groundingChunks = Array.from({ length: 6 }, (_, index) => ({
      web: { title: `Fuente ${index}`, uri: `https://example.com/${index}` },
    }));
    metadata.groundingSupports = [
      ['"name":"Mostaza Heinz"', 0],
      ['"referenceAmount":100,"referenceUnit":"g"', 1],
      ['"calories":54', 2],
      ['"protein":3.5', 3],
      ['"carbs":6', 4],
      ['"fat":1.8', 5],
    ].map(([text, index]) => ({
      segment: { text: String(text) },
      groundingChunkIndices: [Number(index)],
    }));
    const result = parseWebProducts(response).products[0];
    expect(
      result.source.kind === 'web_search' && result.source.sources
    ).toHaveLength(5);
    expect(result.referenceAmount).toBe(100);
    expect(result.carbs).toBe(6);
    expect(result.fat).toBeNull();
  });
  it('reports malformed provider responses instead of a fictitious success', () => {
    const response = grounded();
    Object.defineProperty(response, 'text', {
      value: '{"products":[{"name":"fake"}]}',
    });
    expect(() => parseWebProducts(response)).toThrow('datos inválidos');
  });
});
