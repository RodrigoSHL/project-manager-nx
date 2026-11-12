import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MacroFitWorkspace } from '../app/app';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../testing/nutrition-fixture';
import { createPautaTemplate } from '../data/pauta-template';
import { getTodayDateString } from '../hooks/useMacroStore';
import {
  EquivalenceSuggestions,
  FoodItem,
  NutritionPlan,
} from '../types/nutrition';
import { ProductEquivalenceModal } from './ProductEquivalenceModal';
import { nutritionRequest } from '../utils/nutritionApi';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const user = {
  userId: 'product-setup-test',
  name: 'Test',
  email: 'test@example.invalid',
  roles: ['user'],
};
const plan: NutritionPlan = {
  ...createPautaTemplate(getTodayDateString()),
  version: 1,
  createdAt: new Date().toISOString(),
  rules: [
    {
      id: 'tuna-ref',
      name: 'Atún al agua escurrido',
      referenceAmount: 60,
      unit: 'g',
      foodIds: [],
      aliases: [],
      contributions: [{ group: 'protein', portions: 1 }],
      free: false,
      notes: 'Referencia de prueba.',
    },
  ],
};
const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
async function createProduct() {
  fireEvent.click(screen.getByRole('button', { name: 'Planificación' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mis productos' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Ingresar producto manualmente' })
  );
  set('Nombre del producto', 'Atún marca propia');
  set('Cantidad base', '100');
  set('Energía (kcal)', '100');
  set('Proteínas (g)', '25');
  set('Carbohidratos (g)', '0');
  set('Grasas totales (g)', '1');
  fireEvent.click(screen.getByLabelText(/Revisé la cantidad base/));
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
  );
}
it('continues from creating a product to a reviewed equivalence and reuses it without requiring a consumed meal', async () => {
  const records = nutritionFixture({ ...testAccount, nutritionPlan: plan });
  const suggest = vi.fn(async (url: string, init: RequestInit) => {
    const id = url.split('/').at(-2);
    if (!id) throw new Error('Expected product recommendation route');
    const input = JSON.parse(String(init.body));
    return {
      ok: true,
      json: async (): Promise<EquivalenceSuggestions> => ({
        status: 'suggestions',
        source: 'saved',
        message: 'Referencia guardada para revisar.',
        missingInfo: [],
        basis: {
          mealId: null,
          productId: id,
          dayPlanVersion: null,
          catalogPlanVersion: input.catalogPlanVersion,
        },
        suggestions: [
          {
            key: 'catalog:0',
            origin: 'catalog',
            match: 'related',
            confidence: 'medium',
            explanation: 'Mismo tipo de alimento.',
            uncertainty: 'Confirma preparación y marca.',
            rule: plan.rules[0],
          },
        ],
      }),
    };
  });
  vi.stubGlobal('fetch', (url: string, init: RequestInit) =>
    url.endsWith('/equivalence-suggestions')
      ? suggest(url, init)
      : records.fetch(url, init)
  );
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  await screen.findByText('Registrar comida con IA');
  await createProduct();
  const modal = await screen.findByRole('dialog', {
    name: 'Equivalencia del producto',
  });
  expect(records.account().customFoods).toHaveLength(1);
  expect(records.account().nutritionPlan?.version).toBe(1);
  expect(screen.getByText(/Ficha nutricional guardada/)).toBeTruthy();
  expect(suggest).not.toHaveBeenCalled();
  fireEvent.click(
    within(modal).getByRole('button', { name: 'Buscar en mi pauta' })
  );
  await within(modal).findByText('Referencia guardada para revisar.');
  expect(suggest.mock.calls[0][1]).toMatchObject({
    method: 'POST',
    body: JSON.stringify({ catalogPlanVersion: 1, useAi: false }),
  });
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Aplicar al formulario: Atún al agua escurrido',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('60');
  expect(records.account().nutritionPlan?.version).toBe(1);
  expect(
    within(modal).getByText('Por 100 g de este producto: 1,67 Proteínas')
  ).toBeTruthy();
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Guardar equivalencia del producto',
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const product = records.account().customFoods[0];
  expect(records.account().nutritionPlan).toMatchObject({
    version: 2,
    targets: plan.targets,
  });
  expect(records.account().nutritionPlan?.rules.at(-1)).toMatchObject({
    foodIds: [product.id],
    referenceAmount: 60,
    contributions: [{ group: 'protein', portions: 1 }],
  });
  expect([...records.days.values()].flatMap((day) => day.meals)).toEqual([]);
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Configurar equivalencia de Atún marca propia',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('60');
  expect(
    (screen.getByLabelText('Proteínas', { exact: true }) as HTMLInputElement)
      .value
  ).toBe('1');
});
it('saves nutrients without a plan and leaves a clear route to configure its equivalence later', async () => {
  const records = nutritionFixture(testAccount);
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  await screen.findByText('Registrar comida con IA');
  await createProduct();
  await screen.findByText(/Atún marca propia está guardado con sus nutrientes/);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(records.account().nutritionPlan).toBeUndefined();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Configurar equivalencia de Atún marca propia',
    })
  );
  expect(screen.getByText('La equivalencia puede esperar')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Buscar en mi pauta' })
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Configurar mi pauta' }));
  await screen.findByRole('heading', { name: 'Mi pauta' });
  expect(records.account().customFoods).toHaveLength(1);
});
const savedFood: FoodItem = {
  id: 'tuna',
  name: 'Atún marca propia',
  servingUnit: '100g',
  servingSizeGrams: 100,
  calories: 100,
  protein: 25,
  carbs: 0,
  fat: 1,
  category: 'protein',
};
it('reports a proxy HTML error for chocolate proposals without changing the manual draft or claiming the product has no reference', async () => {
  const food: FoodItem = {
    ...savedFood,
    id: 'chocolate',
    name: 'Chips de chocolate 60% sin azúcar',
    calories: 600,
    protein: 5,
    carbs: 50,
    fat: 42,
    category: 'fats',
  };
  const onSave = vi.fn();
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    const input = JSON.parse(String(init.body));
    return input.useAi
      ? new Response('<!DOCTYPE html><title>Proxy error</title>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        })
      : new Response(
          JSON.stringify({
            status: 'insufficient',
            source: 'saved',
            message:
              'Todavía no hay una referencia guardada para este chocolate.',
            missingInfo: [],
            suggestions: [],
            basis: {
              mealId: null,
              productId: food.id,
              dayPlanVersion: null,
              catalogPlanVersion: plan.version,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
  });
  vi.stubGlobal('fetch', fetch);
  render(
    <ProductEquivalenceModal
      food={food}
      plan={plan}
      onSave={onSave}
      onSuggest={(id, input, signal) =>
        nutritionRequest(
          `/foods/${id}/equivalence-suggestions`,
          'POST',
          input,
          signal
        )
      }
      onClose={() => undefined}
      onOpenPlan={() => undefined}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Buscar en mi pauta' }));
  await screen.findByText(
    'Todavía no hay una referencia guardada para este chocolate.'
  );
  set('Cantidad de referencia', '10');
  set('Grasas', '0.5');
  fireEvent.click(screen.getByRole('button', { name: 'Proponer con IA' }));
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('HTTP 502');
  expect(error.textContent).not.toMatch(/Unexpected token|DOCTYPE|Proxy error/);
  expect(
    screen.queryByText(
      'Todavía no hay una referencia guardada para este chocolate.'
    )
  ).toBeNull();
  expect(screen.getByLabelText('Cantidad de referencia')).toHaveProperty(
    'value',
    '10'
  );
  expect(screen.getByLabelText('Grasas', { exact: true })).toHaveProperty(
    'value',
    '0.5'
  );
  expect(
    (
      screen.getByRole('button', {
        name: 'Proponer con IA',
      }) as HTMLButtonElement
    ).disabled
  ).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(onSave).not.toHaveBeenCalled();
  expect(food.calories).toBe(600);
});
it('supports a searchable manual reference, validates input and cancels without changing the product', async () => {
  const onSave = vi.fn().mockResolvedValue(true),
    onSuggest = vi.fn(),
    onClose = vi.fn();
  render(
    <ProductEquivalenceModal
      food={savedFood}
      plan={plan}
      onSave={onSave}
      onSuggest={onSuggest}
      onClose={onClose}
      onOpenPlan={() => undefined}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia del producto' })
  );
  expect(screen.getByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Indica una cantidad positiva')
  );
  set('Buscar referencia de mi pauta', 'ATUN');
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Copiar referencia: Atún al agua escurrido',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('60');
  expect(onSave).not.toHaveBeenCalled();
  expect(onSuggest).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Más tarde' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
it('does not overwrite a concurrent plan update with an old product draft', () => {
  const onSave = vi.fn(),
    onSuggest = vi.fn();
  const props = {
    food: savedFood,
    plan,
    onSave,
    onSuggest,
    onClose: () => undefined,
    onOpenPlan: () => undefined,
  };
  const view = render(<ProductEquivalenceModal {...props} />);
  set('Cantidad de referencia', '77');
  view.rerender(
    <ProductEquivalenceModal {...props} plan={{ ...plan, version: 2 }} />
  );
  expect(screen.getByRole('alert').textContent).toContain('Tu pauta cambió');
  expect(
    (
      screen.getByRole('button', {
        name: 'Guardar equivalencia del producto',
      }) as HTMLButtonElement
    ).disabled
  ).toBe(true);
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('77');
  expect(onSave).not.toHaveBeenCalled();
});
