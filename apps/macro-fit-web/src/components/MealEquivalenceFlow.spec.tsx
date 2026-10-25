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
import { ClassifyMealModal } from './ClassifyMealModal';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../testing/nutrition-fixture';
import { createPautaTemplate } from '../data/pauta-template';
import { getTodayDateString } from '../hooks/useMacroStore';
import {
  EquivalenceSuggestions,
  MealEntry,
  NutritionPlan,
} from '../types/nutrition';

const entry: MealEntry = {
  id: 'potato-meal',
  foodId: 'ai-potatoes',
  foodName: 'Papas fritas en air fryer',
  amountGrams: 200,
  quantity: { amount: 200, unit: 'g' },
  calories: 320,
  protein: 5,
  carbs: 60,
  fat: 7,
  mealType: 'lunch',
  timestamp: '13:00',
};
const plan: NutritionPlan = {
  ...createPautaTemplate('2026-10-23'),
  version: 1,
  createdAt: '2026-10-23T00:00:00.000Z',
};
const user = {
  userId: 'meal-equivalence-test',
  name: 'Test',
  email: 'test@example.invalid',
  roles: ['user'],
};
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

it('creates and reloads a manual meal equivalence without a product, after an explicit preview and confirmation', async () => {
  const today = getTodayDateString();
  const records = nutritionFixture({
    ...testAccount,
    nutritionPlan: { ...plan, startsOn: today },
  });
  records.days.set(today, {
    date: today,
    nutritionPlan: { ...plan, startsOn: today },
    waterIntakeMl: 500,
    meals: [entry],
  });
  vi.stubGlobal('fetch', records.fetch);
  const view = render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  fireEvent.click(
    await screen.findByRole('button', { name: `Clasificar: ${entry.foodName}` })
  );
  const modal = screen.getByRole('dialog', {
    name: 'Clasificar alimento en mi pauta',
  });
  expect(
    within(modal)
      .getByRole('button', { name: 'Todos' })
      .getAttribute('aria-pressed')
  ).toBe('true');
  expect(
    within(modal)
      .getByRole('button', { name: 'Proponer con IA' })
      .hasAttribute('disabled')
  ).toBe(false);
  change('Buscar producto o equivalencia', 'no existe este alimento');
  expect(within(modal).getByText(/No hay coincidencias/)).toBeTruthy();
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Crear equivalencia para este alimento',
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('200');
  change('Cantidad de referencia', '100');
  change('Carbohidratos', '1');
  change('Grasas', '0.25');
  expect(within(modal).getByRole('status').textContent).toContain(
    '2 Carbohidratos + 0,5 Grasas'
  );
  expect(records.account().nutritionPlan?.version).toBe(1);
  expect(records.account().customFoods).toHaveLength(0);
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Guardar equivalencia y clasificar',
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(records.fetch).toHaveBeenCalledWith(
    `/api/macrofit/me/days/${today}/meals/${entry.id}/equivalence`,
    expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining(
        '"expectedQuantity":{"amount":200,"unit":"g"}'
      ),
    })
  );
  expect(records.account().nutritionPlan?.version).toBe(2);
  expect(records.account().customFoods).toHaveLength(0);
  const saved = records.days.get(today)!;
  expect(saved.meals[0]).toMatchObject({
    ...entry,
    pauta: {
      status: 'matched',
      contributions: [
        { group: 'carbs', portions: 2 },
        { group: 'fats', portions: 0.5 },
      ],
    },
  });
  expect(saved.waterIntakeMl).toBe(500);
  view.unmount();
  render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  await screen.findByText('Avance de mi pauta');
  expect(records.days.get(today)?.meals[0].pauta?.status).toBe('matched');
});

it('offers and applies an AI meal proposal without saving it or requiring a product, then saves only after review', async () => {
  const rule = {
    id: 'proposed-meal',
    name: entry.foodName,
    foodIds: [],
    aliases: [],
    referenceAmount: 100,
    unit: 'g' as const,
    free: false,
    contributions: [{ group: 'carbs' as const, portions: 1 }],
    notes: 'Referencia sintética para pruebas.',
  };
  const response: EquivalenceSuggestions = {
    status: 'suggestions',
    source: 'ai',
    message: 'Revisa esta propuesta de prueba.',
    missingInfo: [],
    basis: {
      mealId: entry.id,
      productId: null,
      dayPlanVersion: 1,
      catalogPlanVersion: 2,
    },
    suggestions: [
      {
        key: 'estimate:meal',
        origin: 'estimate',
        match: 'estimated',
        confidence: 'low',
        explanation: 'Cálculo sintético de prueba.',
        uncertainty: 'Los nutrientes pueden ser estimados.',
        rule,
        evidence: {
          method: 'model',
          assumptions: ['Verifica el peso cocido.'],
          sources: [],
        },
      },
    ],
  };
  const onSuggest = vi.fn().mockResolvedValue(response),
    onSaveMeal = vi.fn().mockResolvedValue(true),
    onSave = vi.fn();
  render(
    <ClassifyMealModal
      entry={entry}
      plan={plan}
      catalogPlan={{ ...plan, version: 2 }}
      products={[]}
      onSave={onSave}
      onSaveMeal={onSaveMeal}
      onSuggest={onSuggest}
      onClose={vi.fn()}
    />
  );
  change(
    'Preparación y medida del alimento',
    'Papas naturales, aceite medido, peso cocido.'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Proponer con IA' }));
  await screen.findByText(response.message);
  expect(onSuggest).toHaveBeenCalledWith(
    entry.id,
    expect.objectContaining({
      productId: undefined,
      useAi: true,
      mode: 'estimate',
      preparation: 'Papas naturales, aceite medido, peso cocido.',
    }),
    expect.any(AbortSignal)
  );
  expect(onSaveMeal).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', {
      name: `Aplicar al formulario: ${entry.foodName}`,
    })
  );
  expect(
    (screen.getByLabelText('Cantidad de referencia') as HTMLInputElement).value
  ).toBe('100');
  expect(screen.getByText('2 Carbohidratos')).toBeTruthy();
  expect(onSaveMeal).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar equivalencia y clasificar' })
  );
  await waitFor(() =>
    expect(onSaveMeal).toHaveBeenCalledWith(
      entry.id,
      expect.objectContaining({
        expectedPlanVersion: 2,
        expectedDayPlanVersion: 1,
        expectedQuantity: entry.quantity,
        equivalence: expect.objectContaining({
          referenceAmount: 100,
          contributions: rule.contributions,
        }),
      })
    )
  );
  expect(onSave).not.toHaveBeenCalled();
});

it('ranks name matches from the plan ahead of unrelated personal products, without automatically classifying generic meat', () => {
  const onSave = vi.fn();
  render(
    <ClassifyMealModal
      entry={{ ...entry, foodName: 'Carne' }}
      plan={plan}
      catalogPlan={plan}
      products={[
        {
          id: 'cookie',
          name: 'Galletas',
          servingSizeGrams: 100,
          servingUnit: '100 g',
          calories: 400,
          protein: 5,
          carbs: 70,
          fat: 10,
          category: 'carbs',
        },
      ]}
      onSave={onSave}
      onSaveMeal={vi.fn()}
      onClose={vi.fn()}
    />
  );
  const choices = screen.getAllByRole('button', {
    name: /^Elegir (producto|equivalencia):/,
  });
  expect(choices[0].getAttribute('aria-label')).toMatch(/Carne|vacuno/i);
  expect(
    choices.every((button) => button.getAttribute('aria-pressed') === 'false')
  ).toBe(true);
  expect(onSave).not.toHaveBeenCalled();
  change('Buscar producto o equivalencia', 'papas');
  expect(
    screen.getByRole('button', { name: 'Elegir equivalencia: Papa cocida' })
  ).toBeTruthy();
});

it('keeps a failed AI request recoverable through manual entry and leaves the diary untouched on cancel', async () => {
  const onSaveMeal = vi.fn(),
    onSave = vi.fn(),
    onClose = vi.fn();
  render(
    <ClassifyMealModal
      entry={entry}
      plan={plan}
      catalogPlan={plan}
      products={[]}
      onSave={onSave}
      onSaveMeal={onSaveMeal}
      onSuggest={vi.fn().mockRejectedValue(new Error('Gemini no disponible.'))}
      onClose={onClose}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Proponer con IA' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Gemini no disponible'
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Crear equivalencia para este alimento',
    })
  );
  change('Carbohidratos', '1');
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(onSaveMeal).not.toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});
