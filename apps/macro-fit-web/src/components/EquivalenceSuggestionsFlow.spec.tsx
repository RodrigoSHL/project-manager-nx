import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ClassifyMealModal } from './ClassifyMealModal';
import { ProductEquivalenceModal } from './ProductEquivalenceModal';
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
  fireEvent.click(screen.getByRole('button', { name: 'Buscar en mi pauta' }));

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
  expect(screen.getByText('Buscando referencias…')).toBeTruthy();
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

const proposed: EquivalenceSuggestions = {
  ...response,
  source: 'reference',
  suggestions: [
    {
      key: 'reference:mustard',
      origin: 'estimate',
      match: 'estimated',
      confidence: 'medium',
      explanation:
        'Condimento sin sumar intercambios; conserva sus nutrientes.',
      uncertainty: 'Es una referencia general, no una indicación de tu pauta.',
      evidence: {
        method: 'reference',
        assumptions: ['Confirma que sea mostaza tradicional sin miel.'],
        sources: [
          {
            title: 'UCLA Health · Free Foods',
            url: 'https://www.uclahealth.org/medical-services/endocrinology/diabetes/type-2-diabetes/basic-nutrition',
          },
        ],
      },
      rule: {
        ...reference,
        id: 'proposed-mustard',
        name: 'Mostaza Heinz',
        referenceAmount: 100,
        free: true,
        contributions: [],
        notes:
          'Propuesta orientativa. Fuente: UCLA Health. No incluida en la pauta original.',
      },
    },
  ],
};
it('shows the mustard recommendation, source and assumptions, then saves only after apply and confirmation without changing consumed nutrition', async () => {
  const mustard = {
    ...product,
    id: 'mustard',
    name: 'Mostaza Heinz',
    calories: 54.2,
    protein: 3.5,
    carbs: 6,
    fat: 1.8,
  };
  const consumed = {
    ...entry,
    foodName: 'mostaza',
    amountGrams: 45,
    quantity: { amount: 45, unit: 'g' as const },
    calories: 29,
  };
  const result = {
    ...proposed,
    basis: { ...proposed.basis, productId: mustard.id },
  };
  const onSuggest = vi.fn().mockResolvedValue(result),
    onSaveProduct = vi.fn().mockResolvedValue(true);
  render(
    <ClassifyMealModal
      entry={consumed}
      plan={plan}
      catalogPlan={{ ...plan, version: 2 }}
      products={[mustard]}
      onSuggest={onSuggest}
      onSave={vi.fn()}
      onSaveProduct={onSaveProduct}
      onClose={vi.fn()}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Elegir producto: Mostaza Heinz' })
  );
  request();
  expect(
    await screen.findByText(/Propuesta nueva · no incluida en tu pauta/)
  ).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Fuente general: UCLA Health · Free Foods' })
      .getAttribute('href')
  ).toContain('uclahealth.org');
  expect(
    screen.getByText('Confirma que sea mostaza tradicional sin miel.')
  ).toBeTruthy();
  expect(
    (
      screen.getByLabelText(
        'Libre según mi pauta (sin sumar porciones)'
      ) as HTMLInputElement
    ).checked
  ).toBe(false);
  expect(onSaveProduct).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Aplicar al formulario: Mostaza Heinz' })
  );
  expect(
    (
      screen.getByLabelText(
        'Libre según mi pauta (sin sumar porciones)'
      ) as HTMLInputElement
    ).checked
  ).toBe(true);
  expect(
    (screen.getByLabelText('Notas de la equivalencia') as HTMLTextAreaElement)
      .value
  ).toContain('Propuesta orientativa');
  expect(onSaveProduct).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia y clasificar' })
  );
  await waitFor(() =>
    expect(onSaveProduct).toHaveBeenCalledWith(
      'meal',
      expect.objectContaining({
        productId: mustard.id,
        expectedQuantity: { amount: 45, unit: 'g' },
        equivalence: expect.objectContaining({
          free: true,
          contributions: [],
          notes: expect.stringContaining('Fuente: UCLA Health'),
        }),
      })
    )
  );
  expect(consumed.calories).toBe(29);
});
it('allows a new AI proposal even when the product has no saved match, forwarding estimate mode', async () => {
  const mock = vi
    .fn()
    .mockResolvedValueOnce({
      ...response,
      status: 'insufficient',
      suggestions: [],
      missingInfo: ['No hay referencia guardada.'],
    })
    .mockResolvedValueOnce({
      ...proposed,
      source: 'ai',
      suggestions: [
        {
          ...proposed.suggestions[0],
          evidence: {
            method: 'model',
            assumptions: ['Revisar preparación.'],
            sources: [],
          },
          rule: {
            ...reference,
            name: 'Nueva equivalencia estimada',
            notes: 'Propuesta orientativa de IA.',
          },
        },
      ],
    });
  const { onSaveProduct } = setup(mock);
  request();
  await screen.findByText('No hay referencia guardada.');
  fireEvent.click(screen.getByRole('button', { name: 'Proponer con IA' }));
  await screen.findByText('Nueva equivalencia estimada');
  expect(mock.mock.calls[1][1]).toMatchObject({
    useAi: true,
    mode: 'estimate',
    productId: product.id,
  });
  expect(
    screen.getByText(
      'Estimación del modelo: sin consulta web ni fuente externa verificada.'
    )
  ).toBeTruthy();
  expect(onSaveProduct).not.toHaveBeenCalled();
});
it('offers and saves a new reviewed equivalence from the product module without a diary entry', async () => {
  const onSuggest = vi.fn().mockResolvedValue({
    ...proposed,
    basis: {
      mealId: null,
      productId: product.id,
      dayPlanVersion: null,
      catalogPlanVersion: 1,
    },
  });
  const onSave = vi.fn().mockResolvedValue(true);
  render(
    <ProductEquivalenceModal
      food={product}
      plan={plan}
      onSave={onSave}
      onSuggest={onSuggest}
      onClose={vi.fn()}
      onOpenPlan={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Proponer con IA' }));
  await screen.findByText(/Propuesta nueva · no incluida en tu pauta/);
  expect(onSuggest).toHaveBeenCalledWith(
    product.id,
    { catalogPlanVersion: 1, useAi: true, mode: 'estimate' },
    expect.any(AbortSignal)
  );
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Aplicar al formulario: Mostaza Heinz' })
  );
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia del producto' })
  );
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      product.id,
      expect.objectContaining({
        expectedPlanVersion: 1,
        equivalence: expect.objectContaining({
          free: true,
          referenceAmount: 100,
          notes: expect.stringContaining('Propuesta orientativa'),
        }),
      })
    )
  );
});

it('groups both actions above the explanation and result, then applies a mayonnaise reference of 15 g independently of its 100 g label', async () => {
  const mayonnaise: FoodItem = {
    ...product,
    id: 'mayo',
    name: 'Mayonesa Kraft',
    brand: 'Kraft',
    calories: 707.69,
    protein: 0.76,
    carbs: 2.3,
    fat: 76.92,
  };
  const suggestion: EquivalenceSuggestions = {
    ...proposed,
    source: 'ai',
    message: 'Propuesta de prueba para revisar.',
    basis: {
      mealId: null,
      productId: mayonnaise.id,
      dayPlanVersion: null,
      catalogPlanVersion: 1,
    },
    suggestions: [
      {
        ...proposed.suggestions[0],
        explanation:
          'Referencia de prueba por 15 g, con nutrientes escalados desde los 100 g de la etiqueta.',
        evidence: {
          method: 'model',
          assumptions: ['Confirma la variedad del producto.'],
          sources: [],
        },
        rule: {
          ...reference,
          name: mayonnaise.name,
          referenceAmount: 15,
          contributions: [{ group: 'fats', portions: 0.5 }],
          notes: 'Propuesta de prueba, pendiente de confirmar.',
        },
      },
    ],
  };
  const onSave = vi.fn().mockResolvedValue(true),
    onSuggest = vi.fn().mockResolvedValue(suggestion);
  render(
    <ProductEquivalenceModal
      food={mayonnaise}
      plan={plan}
      onSave={onSave}
      onSuggest={onSuggest}
      onClose={vi.fn()}
      onOpenPlan={vi.fn()}
    />
  );
  const actions = screen.getByRole('group', {
    name: 'Opciones de equivalencia',
  });
  expect(
    within(actions).getByRole('button', { name: 'Buscar en mi pauta' })
  ).toBeTruthy();
  fireEvent.click(
    within(actions).getByRole('button', { name: 'Proponer con IA' })
  );
  const result = await screen.findByText('Propuesta de prueba para revisar.');
  expect(
    actions.compareDocumentPosition(result) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(screen.getByText('15 g de referencia → 0,5 Grasas')).toBeTruthy();
  expect(screen.getByText('Para 100 g del producto: 3,33 Grasas')).toBeTruthy();
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Aplicar al formulario: Mayonesa Kraft',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('15');
  expect(
    (screen.getByLabelText('Grasas', { exact: true }) as HTMLInputElement).value
  ).toBe('0.5');
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia del producto' })
  );
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      'mayo',
      expect.objectContaining({
        equivalence: expect.objectContaining({
          referenceAmount: 15,
          unit: 'g',
          contributions: [{ group: 'fats', portions: 0.5 }],
        }),
      })
    )
  );
});

it('keeps both actions together above a failed AI result so a saved-reference search remains available', async () => {
  const mock = vi
    .fn()
    .mockRejectedValueOnce(
      new Error('La IA propuso ml pero la ficha está en g.')
    );
  const { onSaveProduct } = setup(mock);
  const actions = screen.getByRole('group', {
    name: 'Opciones de equivalencia',
  });
  fireEvent.click(
    within(actions).getByRole('button', { name: 'Proponer con IA' })
  );
  const error = await screen.findByRole('alert');
  expect(
    actions.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    within(actions)
      .getByRole('button', { name: 'Buscar en mi pauta' })
      .hasAttribute('disabled')
  ).toBe(false);
  expect(onSaveProduct).not.toHaveBeenCalled();
});
