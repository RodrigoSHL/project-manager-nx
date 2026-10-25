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
import { getTodayDateString } from '../../hooks/useMacroStore';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../../testing/nutrition-fixture';
import {
  createPautaTemplate,
  FoodItem,
  NutritionPlan,
} from '../../types/nutrition';
import { FoodGuideView } from './FoodGuideView';

const date = getTodayDateString();
const milk: FoodItem = {
  id: 'my-milk',
  name: 'Mi leche guardada',
  servingUnit: '200 ml',
  quantityUnit: 'ml',
  servingSizeGrams: 200,
  calories: 80,
  protein: 7,
  carbs: 10,
  fat: 1,
  isCustom: true,
  category: 'dairy',
};
const plan: NutritionPlan = {
  name: 'Pauta del diario',
  startsOn: date,
  enabled: true,
  version: 1,
  createdAt: new Date().toISOString(),
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
      id: 'milk-rule',
      name: 'Mi leche',
      foodIds: [milk.id],
      aliases: [],
      referenceAmount: 200,
      unit: 'ml',
      free: false,
      contributions: [{ group: 'dairy', portions: 1 }],
      notes: '',
    },
    {
      id: 'pear-rule',
      name: 'Pera de mi pauta',
      foodIds: [],
      aliases: [],
      referenceAmount: 120,
      unit: 'g',
      free: false,
      contributions: [{ group: 'fruits', portions: 1 }],
      notes: '',
    },
    createPautaTemplate(date).rules.find(
      (rule) => rule.id === 'ref-verdura-libre-1'
    )!,
  ],
};
const user = {
  userId: 'guide-test-user',
  email: 'guide@example.invalid',
  name: 'Test',
  roles: ['user'],
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function openGuide(records: ReturnType<typeof nutritionFixture>) {
  vi.stubGlobal('fetch', records.fetch);
  render(<MacroFitWorkspace user={user} onLogout={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Ver opciones' }));
  await screen.findByRole('tab', { name: 'Según mis macros' });
}

it('opens from home, separates both analyses and exposes a missing group despite completed macros', async () => {
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [milk],
    nutritionPlan: plan,
  });
  records.days.set(date, {
    date,
    waterIntakeMl: 0,
    nutritionPlan: plan,
    meals: [
      {
        id: 'full',
        foodId: 'full',
        foodName: 'Comida registrada',
        amountGrams: 1,
        calories: testAccount.goals!.calories,
        protein: testAccount.goals!.proteinGrams,
        carbs: testAccount.goals!.carbsGrams,
        fat: testAccount.goals!.fatGrams,
        mealType: 'lunch',
        timestamp: '12:00',
        pauta: {
          planVersion: 1,
          status: 'matched',
          contributions: [
            { group: 'protein', portions: 10 },
            { group: 'carbs', portions: 4 },
            { group: 'fats', portions: 2 },
          ],
        },
      },
    ],
  });
  await openGuide(records);
  expect(
    screen
      .getByRole('button', { name: 'Qué puedo comer' })
      .getAttribute('aria-current')
  ).toBe('page');
  expect(screen.getByText(/Macros y energía cubiertos/)).toBeTruthy();
  expect(screen.queryByRole('article')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'Según mi pauta' }));
  const milkCard = screen.getByRole('article', {
    name: `Opción: ${milk.name}`,
  });
  expect(within(milkCard).getByText(/carbohidratos \+10 g/)).toBeTruthy();
  expect(screen.getByText(/Cantidad libre según tu pauta/)).toBeTruthy();
  expect(
    screen.getByRole('article', { name: 'Opción: Pera de mi pauta' })
      .textContent
  ).toContain('120 g');
  expect(
    screen.getByRole('article', { name: 'Opción: Pera de mi pauta' })
      .textContent
  ).toContain('falta una ficha nutricional');
  expect(
    records.fetch.mock.calls.filter(([, init]) => init?.method === 'POST')
  ).toHaveLength(0);
  expect(
    records.fetch.mock.calls.every(([path]) =>
      path.startsWith('/api/macrofit/me')
    )
  ).toBe(true);
});
it('previews native millilitres, records only after meal selection and confirmation, and updates the remaining portions', async () => {
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [milk],
    nutritionPlan: plan,
  });
  await openGuide(records);
  fireEvent.click(screen.getByRole('tab', { name: 'Según mi pauta' }));
  fireEvent.click(
    screen.getByRole('button', { name: `Revisar y registrar ${milk.name}` })
  );
  const dialog = screen.getByRole('dialog', { name: 'Registrar esta opción' });
  expect(within(dialog).getByLabelText('Cantidad (ml)')).toHaveProperty(
    'value',
    '200'
  );
  fireEvent.change(within(dialog).getByLabelText('Cantidad (ml)'), {
    target: { value: '300' },
  });
  expect(within(dialog).getByText('+120 kcal')).toBeTruthy();
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Confirmar y registrar' })
  );
  expect(records.days.get(date)?.meals.length ?? 0).toBe(0);
  fireEvent.change(within(dialog).getByLabelText('Tiempo de comida'), {
    target: { value: 'lunch' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Confirmar y registrar' })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(records.days.get(date)?.meals).toHaveLength(1);
  expect(records.days.get(date)?.meals[0]).toMatchObject({
    mealType: 'lunch',
    quantity: { amount: 300, unit: 'ml' },
    calories: 120,
    pautaSelection: { ruleId: 'milk-rule' },
    pauta: { contributions: [{ group: 'dairy', portions: 1.5 }] },
  });
  expect(screen.getByText('Faltan 1,5 porciones')).toBeTruthy();
});
it('uses the selected day snapshot instead of the newer account plan, and changes date without writes', async () => {
  const latest = {
    ...plan,
    version: 2,
    name: 'Pauta nueva',
    targets: { ...plan.targets, dairy: 5 },
  };
  const records = nutritionFixture({
    ...testAccount,
    customFoods: [milk],
    nutritionPlan: latest,
  });
  const yesterdayDate = new Date(`${date}T12:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(
    yesterdayDate.getMonth() + 1
  ).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
  records.days.set(yesterday, {
    date: yesterday,
    nutritionPlan: plan,
    meals: [],
    waterIntakeMl: 0,
  });
  await openGuide(records);
  fireEvent.change(screen.getByLabelText('Fecha del diario'), {
    target: { value: yesterday },
  });
  await screen.findByRole('tab', { name: 'Según mi pauta' });
  fireEvent.click(screen.getByRole('tab', { name: 'Según mi pauta' }));
  expect(screen.getByText(/Pauta del diario · versión 1/)).toBeTruthy();
  expect(screen.getAllByText('0 / 3')).toHaveLength(2);
  expect(screen.queryByText('0 / 5')).toBeNull();
  expect(
    records.fetch.mock.calls.filter(([, init]) => init?.method === 'POST')
  ).toHaveLength(0);
});
it('keeps the review open on a failed save and supports cancelling without another write', async () => {
  const add = vi.fn().mockResolvedValue(false);
  render(
    <FoodGuideView
      date={date}
      goals={testAccount.goals!}
      meals={[]}
      foods={[milk]}
      plan={plan}
      onAddMeal={add}
      onOpenPlan={vi.fn()}
      onOpenProducts={vi.fn()}
      onOpenDiary={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Según mi pauta' }));
  const open = screen.getByRole('button', {
    name: `Revisar y registrar ${milk.name}`,
  });
  open.focus();
  fireEvent.click(open);
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Tiempo de comida'), {
    target: { value: 'dinner' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Confirmar y registrar' })
  );
  expect((await within(dialog).findByRole('alert')).textContent).toContain(
    'No se pudo confirmar'
  );
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(add).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(open);
});
it('offers setup without inventing an exchange plan and supports keyboard switching between analyses', () => {
  const configure = vi.fn();
  render(
    <FoodGuideView
      date={date}
      goals={testAccount.goals!}
      meals={[]}
      foods={[milk]}
      onAddMeal={vi.fn()}
      onOpenPlan={configure}
      onOpenProducts={vi.fn()}
      onOpenDiary={vi.fn()}
    />
  );
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Según mis macros' }), {
    key: 'ArrowRight',
  });
  expect(
    screen
      .getByRole('tab', { name: 'Según mi pauta' })
      .getAttribute('aria-selected')
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Configurar mi pauta' }));
  expect(configure).toHaveBeenCalledOnce();
});
