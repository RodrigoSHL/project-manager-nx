import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ClassifyMealModal } from './ClassifyMealModal';
import {
  EquivalenceSuggestions,
  FoodItem,
  MealEntry,
  NutritionPlan,
} from '../types/nutrition';
import { createPautaTemplate } from '../data/pauta-template';

afterEach(() => cleanup());
const reference = {
  id: 'tuna-ref',
  name: 'Atún al agua escurrido',
  foodIds: [],
  aliases: [],
  referenceAmount: 60,
  unit: 'g' as const,
  free: false,
  contributions: [{ group: 'protein' as const, portions: 1 }],
  notes: 'Referencia guardada de prueba.',
};
const plan: NutritionPlan = {
  ...createPautaTemplate('2026-10-23'),
  version: 1,
  createdAt: '2026-10-23T00:00:00.000Z',
  rules: [reference],
};
const product: FoodItem = {
  id: 'tuna-product',
  name: 'Atún marca propia',
  brand: 'Marca propia',
  servingUnit: '100g',
  servingSizeGrams: 100,
  calories: 100,
  protein: 25,
  carbs: 0,
  fat: 1,
  category: 'protein',
};
const second = { ...product, id: 'other-product', name: 'Otro producto' };
const entry: MealEntry = {
  id: 'meal',
  foodId: 'ai-tuna',
  foodName: 'Atún',
  amountGrams: 120,
  quantity: { amount: 120, unit: 'g' },
  calories: 120,
  protein: 30,
  carbs: 0,
  fat: 1.2,
  mealType: 'lunch',
  timestamp: '13:00',
};
const response: EquivalenceSuggestions = {
  status: 'suggestions',
  source: 'saved',
  message: 'Revisa antes de guardar.',
  missingInfo: [],
  basis: {
    mealId: 'meal',
    productId: product.id,
    dayPlanVersion: 1,
    catalogPlanVersion: 2,
  },
  suggestions: [
    {
      key: 'day:0',
      origin: 'day',
      match: 'related',
      confidence: 'medium',
      explanation: 'Mismo alimento con preparación por revisar.',
      uncertainty: 'Comprueba que sea al agua.',
      rule: reference,
    },
  ],
};
function setup(onSuggest = vi.fn().mockResolvedValue(response)) {
  const onSave = vi.fn().mockResolvedValue(true),
    onSaveProduct = vi.fn().mockResolvedValue(true),
    onClose = vi.fn();
  const props = {
    entry,
    plan,
    catalogPlan: { ...plan, version: 2 },
    products: [product, second],
    onSuggest,
    onSave,
    onSaveProduct,
    onClose,
  };
  const view = render(<ClassifyMealModal {...props} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Elegir producto: Atún marca propia' })
  );
  return { ...view, props, onSuggest, onSave, onSaveProduct };
}
const request = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Sugerir equivalencia' }));

it('shows the real reference and consumed portions, preserves manual input until applied and only saves on explicit confirmation', async () => {
  let resolve!: (value: EquivalenceSuggestions) => void;
  const mock = vi.fn().mockImplementation(
    () =>
      new Promise<EquivalenceSuggestions>((done) => {
        resolve = done;
      })
  );
  const { onSave, onSaveProduct } = setup(mock);
  request();
  request();
  expect(mock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Comparando referencias…')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Cantidad de referencia'), {
    target: { value: '77' },
  });
  resolve(response);
  await screen.findByText('60 g de referencia → 1 Proteínas');
  expect(screen.getByText('Tu consumo: 2 Proteínas')).toBeTruthy();
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('77');
  expect(onSave).not.toHaveBeenCalled();
  expect(onSaveProduct).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Aplicar al formulario: Atún al agua escurrido',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('60');
  expect(
    (screen.getByLabelText('Proteínas', { exact: true }) as HTMLInputElement)
      .value
  ).toBe('1');
  expect(onSaveProduct).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia y clasificar' })
  );
  await waitFor(() =>
    expect(onSaveProduct).toHaveBeenCalledWith(
      'meal',
      expect.objectContaining({
        productId: product.id,
        equivalence: expect.objectContaining({
          referenceAmount: 60,
          contributions: reference.contributions,
          free: false,
        }),
        expectedQuantity: { amount: 120, unit: 'g' },
      })
    )
  );
});
it('cancels a late suggestion when the user selects another product', async () => {
  let resolve!: (value: EquivalenceSuggestions) => void;
  const mock = vi.fn().mockImplementation(
    () =>
      new Promise<EquivalenceSuggestions>((done) => {
        resolve = done;
      })
  );
  setup(mock);
  request();
  const signal = mock.mock.calls[0][2] as AbortSignal;
  fireEvent.click(
    screen.getByRole('button', { name: 'Elegir producto: Otro producto' })
  );
  expect(signal.aborted).toBe(true);
  resolve(response);
  await waitFor(() =>
    expect(screen.queryByText('Revisa antes de guardar.')).toBeNull()
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('100');
});
it('aborts on close/unmount and invalidates replies after day plan changes', async () => {
  const mock = vi.fn().mockImplementation(() => new Promise(() => undefined));
  const view = setup(mock);
  request();
  const firstSignal = mock.mock.calls[0][2] as AbortSignal;
  view.rerender(
    <ClassifyMealModal {...view.props} plan={{ ...plan, version: 3 }} />
  );
  expect(firstSignal.aborted).toBe(true);
  request();
  const secondSignal = mock.mock.calls[1][2] as AbortSignal;
  view.unmount();
  expect(secondSignal.aborted).toBe(true);
});
it('keeps saved references available when the explicit AI comparison fails and never hides its error', async () => {
  const mock = vi
    .fn()
    .mockResolvedValueOnce(response)
    .mockRejectedValueOnce(new Error('Gemini no está disponible.'));
  const { onSaveProduct } = setup(mock);
  request();
  await screen.findByText('Tu consumo: 2 Proteínas');
  fireEvent.click(screen.getByRole('button', { name: 'Comparar con IA' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Gemini no está disponible.'
  );
  expect(mock.mock.calls[1][1]).toMatchObject({
    useAi: true,
    productId: product.id,
    dayPlanVersion: 1,
    catalogPlanVersion: 2,
  });
  expect(
    screen.getByRole('button', { name: /Aplicar al formulario/ })
  ).toBeTruthy();
  expect(onSaveProduct).not.toHaveBeenCalled();
});
it('explains missing references without marking a product free, and leaves the pending flow available', async () => {
  const mock = vi.fn().mockResolvedValue({
    ...response,
    status: 'insufficient',
    suggestions: [],
    message: 'Falta una referencia de tu pauta.',
    missingInfo: ['Confirma la cantidad y las porciones para este alimento.'],
  });
  const { onSave, onSaveProduct } = setup(mock);
  request();
  await screen.findByText('Falta una referencia de tu pauta.');
  expect(screen.getByText(/No se deduce que sea libre/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Comparar con IA' })).toBeNull();
  expect(
    (
      screen.getByLabelText(
        'Libre según mi pauta (sin sumar porciones)'
      ) as HTMLInputElement
    ).checked
  ).toBe(false);
  expect(onSaveProduct).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Dejar pendiente' }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith('meal', { ruleId: null })
  );
});
it('rejects a response for another product and never applies its draft', async () => {
  setup(
    vi.fn().mockResolvedValue({
      ...response,
      basis: { ...response.basis, productId: 'other' },
    })
  );
  request();
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'La respuesta corresponde a otra selección. Vuelve a solicitar la ayuda.'
  );
  expect(
    screen.queryByRole('button', { name: /Aplicar al formulario/ })
  ).toBeNull();
});
it('requests an explicit consumed unit when a reference cannot be converted from grams', async () => {
  setup(
    vi.fn().mockResolvedValue({
      ...response,
      suggestions: [
        {
          ...response.suggestions[0],
          rule: { ...reference, referenceAmount: 1, unit: 'ml' },
        },
      ],
    })
  );
  request();
  await screen.findByText(
    'Tu consumo: Falta indicar la cantidad consumida en la unidad de esta referencia.'
  );
  fireEvent.click(
    screen.getByRole('button', { name: /Aplicar al formulario/ })
  );
  expect(
    (screen.getByLabelText('Unidad de referencia') as HTMLSelectElement).value
  ).toBe('ml');
  expect(
    screen.getByLabelText(/^Cantidad consumida para la pauta \(ml\)/)
  ).toBeTruthy();
});
