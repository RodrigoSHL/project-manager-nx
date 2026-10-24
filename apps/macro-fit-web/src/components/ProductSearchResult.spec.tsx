import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProductSearchResult } from './ProductSearchResult';
import { ProductSearchItem } from '../types/nutrition';

const product: ProductSearchItem = {
  name: 'Lavazza Espresso',
  brand: 'Lavazza',
  barcode: '8000070052741',
  referenceAmount: 100,
  referenceUnit: 'g',
  calories: 200,
  protein: 12,
  carbs: 0,
  fat: null,
  fiber: null,
  warnings: [],
  source: { kind: 'open_food_facts' },
  preview: {
    description: 'Café en grano',
    quantity: '1 kg',
    categories: ['Café'],
    imageUrl:
      'https://images.openfoodfacts.org/images/products/8000070052741/front.1.200.jpg',
  },
};
afterEach(cleanup);
it('distinguishes products with an image, package, description, base and partial nutrition without saving', () => {
  const onReview = vi.fn();
  render(
    <ProductSearchResult
      product={product}
      existing={false}
      busy={false}
      reviewing={false}
      onReview={onReview}
    />
  );
  expect(screen.getByText('Envase: 1 kg')).toBeTruthy();
  expect(screen.getByText('Café en grano')).toBeTruthy();
  expect(screen.getByText('Ficha incompleta · 3/4 valores')).toBeTruthy();
  expect(screen.getByText('Por 100 g')).toBeTruthy();
  expect(screen.getByText('0 g')).toBeTruthy();
  expect(screen.getByText('Sin dato')).toBeTruthy();
  expect(onReview).not.toHaveBeenCalled();
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Sin imagen')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Revisar e importar' }));
  expect(onReview).toHaveBeenCalledTimes(1);
});
it('shows unavailable data explicitly and supports older results without preview metadata', () => {
  render(
    <ProductSearchResult
      product={{
        ...product,
        preview: undefined,
        brand: null,
        calories: null,
        protein: null,
        carbs: null,
      }}
      existing={false}
      busy={false}
      reviewing={false}
      onReview={vi.fn()}
    />
  );
  expect(screen.getByText('Sin macros en la vista previa')).toBeTruthy();
  expect(screen.getByText('Marca no informada')).toBeTruthy();
  expect(screen.getByText('Sin imagen')).toBeTruthy();
  expect(screen.queryByText('0 g')).toBeNull();
});
it('separates an unknown base unit from available nutrients and disables actions while reviewing', () => {
  render(
    <ProductSearchResult
      product={{ ...product, referenceUnit: null, fat: 3 }}
      existing={false}
      busy
      reviewing
      onReview={vi.fn()}
    />
  );
  expect(screen.getByText('Macros disponibles')).toBeTruthy();
  expect(screen.getByText('Por 100 · confirma si es g o ml')).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: 'Cargando ficha…',
      }) as HTMLButtonElement
    ).disabled
  ).toBe(true);
});
