import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProductsView } from './ProductsView';
import { searchProducts, searchProductsWeb } from '../utils/productApi';
import { ProductSearchItem } from '../types/nutrition';
vi.mock('../utils/productApi', () => ({
  searchProducts: vi.fn(),
  searchProductsWeb: vi.fn(),
  readProductLabel: vi.fn(),
}));
const product: ProductSearchItem = {
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
  warnings: ['Confirma la variedad en tu envase.'],
  source: {
    kind: 'web_search',
    sources: [
      { title: 'Ficha del fabricante', url: 'https://example.com/mostaza' },
    ],
  },
};
const save = vi.fn().mockResolvedValue(true);
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);
const mount = () =>
  render(
    <ProductsView
      foods={[]}
      onSave={save}
      onDelete={vi.fn()}
      onOpenPlan={vi.fn()}
    />
  );
const search = () => {
  fireEvent.change(screen.getByLabelText('Nombre o código de barras'), {
    target: { value: 'Mostaza Heinz' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Buscar en internet con IA' })
  );
};
it('searches only on request, shows sources, reviews without OFF lookup and saves only after confirmation', async () => {
  vi.mocked(searchProductsWeb).mockResolvedValue({
    products: [product],
    message: 'Comprueba tu etiqueta.',
    searchSuggestions:
      '<a href="https://google.com" target="_blank">Google</a>',
  });
  mount();
  expect(searchProductsWeb).not.toHaveBeenCalled();
  search();
  await screen.findByText('Mostaza Heinz');
  expect(save).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole('link', { name: 'Ficha del fabricante' })
      .getAttribute('href')
  ).toBe('https://example.com/mostaza');
  const suggestions = screen.getByTitle('Sugerencias de Google Search');
  expect(suggestions.getAttribute('sandbox')).not.toContain('allow-scripts');
  fireEvent.click(screen.getByRole('button', { name: 'Revisar e importar' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByLabelText('Energía (kcal)')).toHaveProperty(
    'value',
    '54'
  );
  expect(searchProducts).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(
    within(dialog).getByLabelText(
      'Revisé la cantidad base, la unidad, las calorías y los macros.'
    )
  );
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: 'Guardar producto en mi cuenta',
    })
  );
  await screen.findByText(/Mostaza Heinz está guardado/);
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Mostaza Heinz',
      calories: 54,
      productSource: product.source,
    })
  );
});
it('keeps missing nutrition empty for label completion and does not invent zeros', async () => {
  vi.mocked(searchProductsWeb).mockResolvedValue({
    products: [
      { ...product, calories: null, protein: null, carbs: null, fat: null },
    ],
    message: 'Completa la etiqueta.',
    searchSuggestions: null,
  });
  mount();
  search();
  await screen.findByText('Mostaza Heinz');
  fireEvent.click(screen.getByRole('button', { name: 'Revisar e importar' }));
  expect(screen.getByLabelText('Energía (kcal)')).toHaveProperty('value', '');
  expect(screen.getByLabelText('Proteínas (g)')).toHaveProperty('value', '');
  expect(save).not.toHaveBeenCalled();
});
it('reports quota errors and leaves the other search available', async () => {
  vi.mocked(searchProductsWeb).mockRejectedValue(
    new Error('Gemini agotó su cuota.')
  );
  vi.mocked(searchProducts).mockResolvedValue([]);
  mount();
  search();
  expect((await screen.findByRole('alert')).textContent).toContain(
    'agotó su cuota'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Buscar en Open Food Facts' })
  );
  await screen.findByText(/No encontramos ese producto/);
  expect(searchProducts).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});
