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

const user = {
  userId: 'equivalence-test',
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
const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

it('creates a personal product, finds it from a pending meal, defines its exchange and persists both the plan and consumed portions', async () => {
  const today = getTodayDateString();
  const records = nutritionFixture({
    ...testAccount,
    nutritionPlan: {
      ...createPautaTemplate(today),
      startsOn: today,
      version: 1,
      createdAt: new Date().toISOString(),
    },
  });
  const mustard = {
    id: 'mustard-meal',
    foodId: 'ai-mustard',
    foodName: 'Mostaza',
    amountGrams: 30,
    quantity: { amount: 30, unit: 'g' as const },
    calories: 18,
    protein: 1.2,
    carbs: 1.5,
    fat: 0.8,
    mealType: 'lunch' as const,
    timestamp: '13:00',
  };
  records.days.set(today, {
    date: today,
    meals: [mustard],
    waterIntakeMl: 500,
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  await screen.findByText('Avance de mi pauta');
  fireEvent.click(screen.getByRole('button', { name: 'Mis productos' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Ingresar producto manualmente' })
  );
  set('Nombre del producto', 'Mostaza Heinz');
  set('Marca (opcional)', 'Heinz');
  set('Código de barras (opcional)', '7801234567890');
  set('Cantidad base', '100');
  set('Energía (kcal)', '90');
  set('Proteínas (g)', '5');
  set('Carbohidratos (g)', '10');
  set('Grasas totales (g)', '3');
  fireEvent.click(screen.getByLabelText(/Revisé la cantidad base/));
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
  );
  await waitFor(() => expect(records.account().customFoods).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: 'Diario' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clasificar: Mostaza' }));
  const modal = screen.getByRole('dialog', {
    name: 'Clasificar alimento en mi pauta',
  });
  fireEvent.change(
    within(modal).getByLabelText('Buscar producto o equivalencia'),
    { target: { value: 'HEINZ' } }
  );
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Elegir producto: Mostaza Heinz',
    })
  );
  expect(within(modal).getByText(/Por 100 g: 90 kcal/)).toBeTruthy();
  fireEvent.change(within(modal).getByLabelText('Cantidad de referencia'), {
    target: { value: '15' },
  });
  fireEvent.change(within(modal).getByLabelText('Grasas', { exact: true }), {
    target: { value: '0.25' },
  });
  expect(within(modal).getByRole('status').textContent).toContain('0,5 Grasas');
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Guardar equivalencia y clasificar',
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const saved = records.days.get(today)?.meals[0];
  expect(saved).toMatchObject({
    ...mustard,
    pauta: {
      status: 'matched',
      ruleName: 'Mostaza Heinz',
      contributions: [{ group: 'fats', portions: 0.5 }],
    },
  });
  expect(records.days.get(today)?.waterIntakeMl).toBe(500);
  expect(records.account().nutritionPlan?.rules.at(-1)?.foodIds).toEqual([
    records.account().customFoods[0].id,
  ]);
  expect(records.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/mustard-meal/product-equivalence'),
    expect.objectContaining({ method: 'PUT' })
  );
  expect(localStorage.length).toBe(0);
});

it('keeps an invalid equivalence open, supports an explicit free food and restores focus on cancel', async () => {
  const today = getTodayDateString();
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [
      {
        id: 'heinz',
        name: 'Mostaza Heinz',
        brand: 'Heinz',
        servingUnit: '100 g',
        servingSizeGrams: 100,
        calories: 90,
        protein: 5,
        carbs: 10,
        fat: 3,
        category: 'custom',
        isCustom: true,
      },
    ],
    nutritionPlan: {
      ...createPautaTemplate(today),
      startsOn: today,
      version: 1,
      createdAt: new Date().toISOString(),
    },
  });
  records.days.set(today, {
    date: today,
    meals: [
      {
        id: 'mustard',
        foodId: 'ai',
        foodName: 'Mostaza',
        amountGrams: 15,
        calories: 10,
        protein: 1,
        carbs: 1,
        fat: 1,
        mealType: 'lunch',
        timestamp: '13:00',
      },
    ],
    waterIntakeMl: 0,
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  const trigger = await screen.findByRole('button', {
    name: 'Clasificar: Mostaza',
  });
  trigger.focus();
  fireEvent.click(trigger);
  let modal = screen.getByRole('dialog');
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Elegir producto: Mostaza Heinz',
    })
  );
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Guardar equivalencia y clasificar',
    })
  );
  expect(within(modal).getByRole('alert')).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(records.account().nutritionPlan?.version).toBe(1);
  fireEvent.click(trigger);
  modal = screen.getByRole('dialog');
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Elegir producto: Mostaza Heinz',
    })
  );
  fireEvent.click(
    within(modal).getByLabelText('Libre según mi pauta (sin sumar porciones)')
  );
  fireEvent.click(
    within(modal).getByRole('button', {
      name: 'Guardar equivalencia y clasificar',
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(records.days.get(today)?.meals[0].pauta).toMatchObject({
    status: 'free',
    contributions: [],
  });
});
