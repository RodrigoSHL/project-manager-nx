import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { MacroFitWorkspace } from '../app/app';
import { getTodayDateString } from '../hooks/useMacroStore';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../testing/nutrition-fixture';
import { calculatePauta, MealEntry, NutritionPlan } from '../types/nutrition';

const user = {
  userId: 'quantity-test',
  name: 'Test',
  email: 'quantity@example.invalid',
  roles: ['user'],
};
const plan: NutritionPlan = {
  name: 'Pauta',
  enabled: true,
  startsOn: getTodayDateString(),
  version: 1,
  createdAt: new Date().toISOString(),
  targets: {
    protein: 10,
    carbs: null,
    fats: null,
    dairy: null,
    fruits: null,
    veggies: null,
    supplements: null,
  },
  waterTargetMl: 2000,
  waterIsMinimum: false,
  rules: [
    {
      id: 'tuna',
      name: 'Atún',
      foodIds: ['tuna'],
      aliases: [],
      referenceAmount: 60,
      unit: 'g',
      contributions: [{ group: 'protein', portions: 1 }],
      free: false,
      notes: '',
    },
  ],
};
const tuna: MealEntry = {
  id: 'tuna-entry',
  mealType: 'breakfast',
  foodId: 'tuna',
  foodName: 'Atún en lata',
  amountGrams: 140,
  quantity: { amount: 140, unit: 'g' },
  calories: 140,
  protein: 28,
  carbs: 0,
  fat: 1.4,
  timestamp: '08:00',
};
function records(entry = tuna) {
  const fixture = nutritionFixture({ ...testAccount, nutritionPlan: plan });
  fixture.days.set(getTodayDateString(), {
    date: getTodayDateString(),
    nutritionPlan: plan,
    waterIntakeMl: 250,
    meals: [{ ...entry, pauta: calculatePauta(plan, entry) }],
  });
  return fixture;
}
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
async function openEditor(name: string) {
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Expandir Desayuno' })
  );
  fireEvent.click(
    screen.getByRole('button', { name: `Editar cantidad de ${name}` })
  );
  return screen.getByRole('dialog', { name: 'Editar cantidad' });
}
it('makes the general AI actions icon-only while retaining their accessible names', async () => {
  vi.stubGlobal('fetch', records().fetch);
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  const group = await screen.findByRole('group', {
    name: 'Registrar comida con inteligencia artificial',
  });
  const buttons = within(group).getAllByRole('button');
  expect(buttons).toHaveLength(2);
  expect(buttons.every((button) => !button.textContent?.trim())).toBe(true);
  fireEvent.click(
    within(group).getByRole('button', { name: 'Escribir / Dictar comida' })
  );
  expect(screen.getByLabelText('¿Qué comiste?')).toBeTruthy();
});
it('edits 140 g of tuna to 120 g without adding a meal and refreshes nutrient and pauta totals', async () => {
  const fixture = records();
  vi.stubGlobal('fetch', fixture.fetch);
  const dialog = await openEditor(tuna.foodName);
  fireEvent.change(within(dialog).getByLabelText('Cantidad (g)'), {
    target: { value: '120' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Guardar cantidad' })
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Editar cantidad' })).toBeNull()
  );
  const day = fixture.days.get(getTodayDateString());
  if (!day) throw new Error('Expected the saved diary.');
  expect(day.meals).toHaveLength(1);
  expect(day.meals[0]).toMatchObject({
    id: tuna.id,
    amountGrams: 120,
    calories: 120,
    protein: 24,
    fat: 1.2,
    pauta: { contributions: [{ group: 'protein', portions: 2 }] },
  });
  expect(day.waterIntakeMl).toBe(250);
  expect(screen.getByText('1 alimento · 120 kcal')).toBeTruthy();
  expect(
    fixture.fetch.mock.calls.some(
      ([path, init]) =>
        path.endsWith('/meals/tuna-entry/quantity') &&
        init?.method === 'PUT' &&
        JSON.parse(init.body as string).expectedQuantity.amount === 140
    )
  ).toBe(true);
  expect(localStorage.length).toBe(0);
});
it('retains the native ml unit and permits a decimal quantity', async () => {
  const milk = {
    ...tuna,
    id: 'milk',
    foodId: 'milk',
    foodName: 'Leche',
    amountGrams: 200,
    quantity: { amount: 200, unit: 'ml' as const },
    calories: 120,
  };
  const fixture = records(milk);
  vi.stubGlobal('fetch', fixture.fetch);
  const dialog = await openEditor('Leche');
  fireEvent.change(within(dialog).getByLabelText('Cantidad (ml)'), {
    target: { value: '125.5' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Guardar cantidad' })
  );
  await waitFor(() =>
    expect(fixture.days.get(getTodayDateString())?.meals[0].quantity).toEqual({
      amount: 125.5,
      unit: 'ml',
    })
  );
  expect(fixture.days.get(getTodayDateString())?.meals[0].id).toBe('milk');
});
it('keeps the form and original meal on storage failure, and cancelling sends no write', async () => {
  const fixture = records();
  vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
    path.endsWith('/quantity')
      ? Promise.resolve({
          ok: false,
          status: 503,
          json: async () => ({ message: 'No se pudo guardar la cantidad' }),
        })
      : fixture.fetch(path, init)
  );
  let dialog = await openEditor(tuna.foodName);
  fireEvent.change(within(dialog).getByLabelText('Cantidad (g)'), {
    target: { value: '120' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(
    fixture.fetch.mock.calls.some(([, init]) => init?.method === 'PUT')
  ).toBe(false);
  fireEvent.click(
    screen.getByRole('button', { name: `Editar cantidad de ${tuna.foodName}` })
  );
  dialog = screen.getByRole('dialog', { name: 'Editar cantidad' });
  fireEvent.change(within(dialog).getByLabelText('Cantidad (g)'), {
    target: { value: '120' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Guardar cantidad' })
  );
  await within(dialog).findByRole('alert');
  expect(
    (within(dialog).getByLabelText('Cantidad (g)') as HTMLInputElement).value
  ).toBe('120');
  expect(fixture.days.get(getTodayDateString())?.meals[0].amountGrams).toBe(
    140
  );
});
