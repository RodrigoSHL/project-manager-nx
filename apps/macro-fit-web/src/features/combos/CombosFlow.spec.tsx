import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MacroFitWorkspace } from '../../app/app';
import { FoodItem, MealTemplate, NutritionPlan } from '../../types/nutrition';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../../testing/nutrition-fixture';
import { getTodayDateString } from '../../hooks/useMacroStore';
import { CombosView } from './CombosView';

const user = {
  userId: 'combos-user',
  name: 'Test',
  email: 'combos@example.invalid',
  roles: ['user'],
};
const milk: FoodItem = {
  id: 'my-milk',
  name: 'Leche habitual',
  servingSizeGrams: 100,
  servingUnit: '100 ml',
  quantityUnit: 'ml',
  calories: 42,
  protein: 3.4,
  carbs: 5,
  fat: 0.1,
  category: 'dairy',
  isCustom: true,
};
const bread: FoodItem = {
  id: 'my-bread',
  name: 'Pan personal',
  servingSizeGrams: 100,
  servingUnit: '100 g',
  calories: 200,
  protein: 10,
  carbs: 40,
  fat: 2,
  category: 'carbs',
  isCustom: true,
};
const template: MealTemplate = {
  id: 'my-combo',
  name: 'Desayuno diario',
  description: 'Leche y pan',
  mealType: 'breakfast',
  icon: 'utensils',
  isCustom: true,
  items: [
    { foodId: milk.id, amountGrams: 150, quantityUnit: 'ml', food: milk },
    { foodId: bread.id, amountGrams: 70, quantityUnit: 'g', food: bread },
  ],
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
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
async function openModule() {
  await screen.findByText('Registrar comida con IA');
  fireEvent.click(
    screen.getByRole('button', { name: 'Mis combos', exact: true })
  );
}
function pickFood(name: string) {
  change('Buscar alimento para el combo', name);
  fireEvent.click(
    screen.getByRole('button', { name: `Elegir alimento: ${name}` })
  );
}

it('creates, edits, duplicates and reloads independent personal combos, without writing meals until registration', async () => {
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [milk, bread],
  });
  vi.stubGlobal('fetch', records.fetch);
  const view = render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  await openModule();
  expect(screen.queryByRole('article')).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Crear combo', exact: true })
  );
  change('Nombre del combo', 'Desayuno práctico');
  pickFood(milk.name);
  change('Cantidad alimento 1', '150');
  fireEvent.click(screen.getByRole('button', { name: 'Agregar alimento' }));
  pickFood(bread.name);
  change('Cantidad alimento 2', '70');
  const modal = screen.getByRole('dialog', { name: 'Crear combo' });
  expect(
    within(modal).getByText('Energía').nextElementSibling?.textContent
  ).toContain('203');
  expect(records.account().customTemplates).toHaveLength(0);
  fireEvent.click(within(modal).getByRole('button', { name: 'Guardar combo' }));
  await screen.findByRole('article', { name: 'Combo: Desayuno práctico' });
  const originalId = records.account().customTemplates[0].id;
  expect(records.account().customTemplates[0].items[0]).toMatchObject({
    amountGrams: 150,
    quantityUnit: 'ml',
    food: { calories: 42 },
  });
  expect(records.days.get(getTodayDateString())?.meals).toHaveLength(0);
  fireEvent.click(
    screen.getByRole('button', { name: 'Editar combo: Desayuno práctico' })
  );
  change('Nombre del combo', 'Desayuno rápido');
  change('Cantidad alimento 1', '200');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  await screen.findByRole('article', { name: 'Combo: Desayuno rápido' });
  expect(records.account().customTemplates).toHaveLength(1);
  expect(records.account().customTemplates[0].id).toBe(originalId);
  fireEvent.click(
    screen.getByRole('button', { name: 'Duplicar combo: Desayuno rápido' })
  );
  change('Nombre del combo', 'Variante liviana');
  change('Cantidad alimento 1', '100');
  expect(records.account().customTemplates).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  await screen.findByRole('article', { name: 'Combo: Variante liviana' });
  expect(records.account().customTemplates).toHaveLength(2);
  expect(records.account().customTemplates[0].items[0].amountGrams).toBe(200);
  expect(records.account().customTemplates[1].id).not.toBe(originalId);
  expect(records.account().customTemplates[1].items[0].amountGrams).toBe(100);
  view.unmount();
  render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  await openModule();
  expect(screen.getAllByRole('article')).toHaveLength(2);
  fireEvent.click(
    screen.getByRole('button', { name: 'Eliminar combo: Variante liviana' })
  );
  expect(records.account().customTemplates).toHaveLength(2);
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar eliminación' })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(records.account().customTemplates).toHaveLength(1);
  expect(records.account().customTemplates[0].id).toBe(originalId);
  expect(records.days.get(getTodayDateString())?.meals).toHaveLength(0);
  expect(localStorage.length).toBe(0);
});

it('registers scaled native quantities and individual adjustments on the selected date, using its frozen pauta', async () => {
  const date = getTodayDateString();
  const prior = new Date(date + 'T12:00:00');
  prior.setDate(prior.getDate() - 1);
  const yesterday = `${prior.getFullYear()}-${String(
    prior.getMonth() + 1
  ).padStart(2, '0')}-${String(prior.getDate()).padStart(2, '0')}`;
  const plan: NutritionPlan = {
    name: 'Pauta del día',
    enabled: true,
    startsOn: yesterday,
    version: 1,
    createdAt: '2026-10-25T00:00:00Z',
    waterTargetMl: 2000,
    waterIsMinimum: false,
    targets: {
      protein: 10,
      carbs: 4,
      fats: 2,
      dairy: 3,
      fruits: 3,
      veggies: null,
      supplements: 0,
    },
    rules: [
      {
        id: 'milk-cup',
        name: 'Leche en taza',
        foodIds: [],
        aliases: [],
        referenceAmount: 1,
        unit: 'cup',
        free: false,
        contributions: [{ group: 'dairy', portions: 1 }],
        notes: 'Referencia explícita de prueba.',
      },
    ],
  };
  const snapshot = {
    ...milk,
    pautaSelection: {
      ruleId: 'milk-cup',
      quantity: { amount: 0.5, unit: 'cup' as const },
    },
  };
  const saved = {
    ...template,
    items: [{ ...template.items[0], food: snapshot }, template.items[1]],
  };
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [milk, bread],
    customTemplates: [saved],
    nutritionPlan: {
      ...plan,
      version: 2,
      rules: [{ ...plan.rules[0], referenceAmount: 0.5 }],
    },
  });
  records.days.set(yesterday, {
    date: yesterday,
    meals: [],
    waterIntakeMl: 500,
    nutritionPlan: plan,
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  await openModule();
  change('Fecha del diario', yesterday);
  await waitFor(() =>
    expect(screen.queryByText('Cargando tus registros…')).toBeNull()
  );
  fireEvent.click(
    screen
      .getByRole('article', { name: `Combo: ${template.name}` })
      .querySelector('button[title="Editar combo"]')!
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(
    within(screen.getByRole('article')).getByRole('button', {
      name: 'Registrar',
      exact: true,
    })
  );
  const modal = screen.getByRole('dialog', { name: 'Registrar combo' });
  expect(
    within(modal).getByText(`${template.name} · Diario del ${yesterday}`)
  ).toBeTruthy();
  fireEvent.click(within(modal).getByRole('button', { name: 'Doble' }));
  expect(
    (
      within(modal).getByLabelText(
        'Cantidad para registrar 1 ml'
      ) as HTMLInputElement
    ).value
  ).toBe('300');
  change('Cantidad para registrar 1 ml', '250');
  change('Tiempo de comida', 'dinner');
  expect(
    within(modal).getByText('Energía').nextElementSibling?.textContent
  ).toContain('385');
  expect(within(modal).getByText('1,25 Lácteos')).toBeTruthy();
  expect(records.days.get(yesterday)?.meals).toHaveLength(0);
  const confirm = within(modal).getByRole('button', {
    name: 'Confirmar y registrar',
  });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const entries = records.days.get(yesterday)!.meals;
  expect(entries).toHaveLength(2);
  expect(entries[0]).toMatchObject({
    mealType: 'dinner',
    quantity: { amount: 250, unit: 'ml' },
    calories: 105,
    pautaSelection: { quantity: { amount: 1.25, unit: 'cup' } },
    pauta: {
      planVersion: 1,
      contributions: [{ group: 'dairy', portions: 1.25 }],
    },
  });
  expect(entries[1]).toMatchObject({
    mealType: 'dinner',
    quantity: { amount: 140, unit: 'g' },
    calories: 280,
  });
  expect(records.days.get(yesterday)?.waterIntakeMl).toBe(500);
  expect(records.account().customTemplates[0]).toEqual(saved);
  expect(records.account().nutritionPlan?.version).toBe(2);
  expect(records.days.get(date)?.meals).toHaveLength(0);
  expect(
    records.fetch.mock.calls.filter(
      ([url, init]) =>
        url.endsWith(`/days/${yesterday}/meals`) && init?.method === 'POST'
    )
  ).toHaveLength(1);
});

it('repairs an incomplete legacy combo through replacement rather than silently reinterpreting its units', async () => {
  const broken: MealTemplate = {
    ...template,
    items: [{ foodId: 'deleted-food', amountGrams: 30 }],
  };
  const onSave = vi.fn().mockResolvedValue(true);
  render(
    <CombosView
      templates={[broken]}
      examples={[]}
      foods={[milk]}
      date="2026-10-25"
      onDateChange={vi.fn()}
      onSave={onSave}
      onDelete={vi.fn()}
      onApply={vi.fn()}
      onOpenDiary={vi.fn()}
      onOpenProducts={vi.fn()}
    />
  );
  expect(
    screen
      .getByRole('button', { name: 'Registrar', exact: true })
      .hasAttribute('disabled')
  ).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: `Editar combo: ${broken.name}` })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  expect(screen.getByRole('alert').textContent).toContain(
    'Revisa los alimentos'
  );
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Reemplazar alimento 1' })
  );
  pickFood(milk.name);
  expect(
    (screen.getByLabelText('Cantidad alimento 1') as HTMLInputElement).value
  ).toBe('100');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: broken.id,
        items: [
          expect.objectContaining({
            foodId: milk.id,
            quantityUnit: 'ml',
            amountGrams: 100,
            food: milk,
          }),
        ],
      })
    )
  );
});

it('creates a personal copy of an example only after saving, and preserves a failed draft for retry or cancellation', async () => {
  const example = {
    ...structuredClone(template),
    id: 'example',
    isCustom: false,
  };
  const initial = structuredClone(example);
  const onSave = vi
    .fn()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);
  render(
    <CombosView
      templates={[]}
      examples={[example]}
      foods={[milk, bread]}
      date="2026-10-25"
      onDateChange={vi.fn()}
      onSave={onSave}
      onDelete={vi.fn()}
      onApply={vi.fn()}
      onOpenDiary={vi.fn()}
      onOpenProducts={vi.fn()}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Ejemplos para empezar' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Crear copia' }));
  change('Nombre del combo', 'Mi copia');
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  await screen.findByRole('alert');
  expect(
    (screen.getByLabelText('Nombre del combo') as HTMLInputElement).value
  ).toBe('Mi copia');
  expect(screen.queryByText('Combo guardado en tu cuenta.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar combo' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(onSave.mock.calls[1][0].id).not.toBe(example.id);
  expect(onSave.mock.calls[1][0].isCustom).toBe(true);
  expect(example).toEqual(initial);
});

it('opens combo management from the diary and cancels an unsaved duplicate without a write', async () => {
  const records = nutritionFixture({
    ...testAccount,
    customTemplates: [template],
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  await screen.findByText('Registrar comida con IA');
  fireEvent.click(screen.getAllByRole('button', { name: /^Combos:/ })[0]);
  fireEvent.click(
    screen.getByRole('button', { name: 'Administrar mis combos' })
  );
  await screen.findByRole('heading', { name: 'Mis combos' });
  fireEvent.click(
    screen.getByRole('button', { name: `Duplicar combo: ${template.name}` })
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(records.account().customTemplates).toEqual([template]);
  expect(
    records.fetch.mock.calls.some(
      ([url, init]) => url.endsWith('/templates') && init?.method === 'PUT'
    )
  ).toBe(false);
  expect(document.body.style.overflow).not.toBe('hidden');
});
