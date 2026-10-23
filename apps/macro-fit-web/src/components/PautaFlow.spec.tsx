import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MacroFitWorkspace } from '../app/app';
import { createPautaTemplate } from '../data/pauta-template';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../testing/nutrition-fixture';
import { getTodayDateString } from '../hooks/useMacroStore';
import { NutritionPlan, PlateAnalysisResponse } from '../types/nutrition';
import { PlateAnalysisResultModal } from './PlateAnalysisResultModal';

const user = {
  userId: 'pauta-test',
  name: 'Test',
  email: 'pauta@example.invalid',
  roles: ['user'],
};
const App = () => <MacroFitWorkspace user={user} onLogout={() => undefined} />;
const plan = (): NutritionPlan => ({
  ...createPautaTemplate(getTodayDateString()),
  version: 1,
  createdAt: new Date().toISOString(),
});
const analysis: PlateAnalysisResponse = {
  dish_name: 'Comida de prueba',
  meal_type: 'lunch',
  plate_type_detected: 'plato_extendido',
  total_estimated_kcal: 500,
  clinical_tip: '',
  items: [
    {
      name: 'Pechuga de pollo cocida',
      estimated_grams: 200,
      category: 'proteina',
    },
    { name: 'Arroz cocido', estimated_grams: 50, category: 'carbohidrato' },
    { name: 'Palta', estimated_grams: 40, category: 'grasa' },
    { name: 'Mayonesa Kraft', estimated_grams: 9, category: 'grasa' },
  ].map((item) => ({
    ...item,
    confidence: 'media',
    nutritional_density_per_100g: {
      kcal: 100,
      protein_g: 10,
      carbs_g: 5,
      fat_g: 3,
      fiber_g: 0,
    },
  })) as PlateAnalysisResponse['items'],
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('saves a configurable plan separately from calculated macros and shows it for a balanced preset', async () => {
  const records = nutritionFixture();
  vi.stubGlobal('fetch', records.fetch);
  render(<App />);
  await screen.findByText('Registrar comida con IA');
  expect(screen.queryByText('Avance de mi pauta')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'Mi pauta' })[0]);
  fireEvent.click(
    screen.getByRole('button', { name: /Cargar referencia de la pauta/ })
  );
  fireEvent.change(screen.getByLabelText('Proteínas', { exact: true }), {
    target: { value: '12' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar pauta en mi cuenta' })
  );
  await screen.findByText('Avance de mi pauta');
  expect(records.account().nutritionPlan?.targets.protein).toBe(12);
  expect(records.account().goals).toEqual(testAccount.goals);
  expect(screen.getByText('Meta seleccionada: > 2000 ml')).toBeTruthy();
  expect(localStorage.length).toBe(0);
});

it('guides repair of a previously empty plan and explicitly updates today without losing food or nutrients', async () => {
  const blank = {
    ...plan(),
    rules: [],
    targets: {
      protein: null,
      carbs: null,
      fats: null,
      dairy: null,
      fruits: null,
      veggies: null,
      supplements: null,
    },
  };
  const records = nutritionFixture({ ...testAccount, nutritionPlan: blank });
  const today = getTodayDateString();
  records.days.set(today, {
    date: today,
    nutritionPlan: blank,
    waterIntakeMl: 250,
    meals: [
      {
        id: 'existing',
        mealType: 'lunch',
        foodId: 'ai-chicken',
        foodName: 'Pechuga de pollo cocida',
        amountGrams: 200,
        calories: 300,
        protein: 50,
        carbs: 0,
        fat: 12,
        timestamp: '13:00',
      },
    ],
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<App />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Completar pauta' })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar pauta en mi cuenta' })
  );
  expect(screen.getByRole('alert').textContent).toContain(
    'Todavía faltan metas o equivalencias'
  );
  expect(
    records.fetch.mock.calls.filter(([path]) => path.endsWith('/plan'))
  ).toHaveLength(0);
  fireEvent.click(
    screen.getByRole('button', { name: /Cargar referencia de la pauta/ })
  );
  expect(
    (
      screen.getByRole('checkbox', {
        name: 'Aplicar también al diario de hoy',
      }) as HTMLInputElement
    ).checked
  ).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar pauta en mi cuenta' })
  );
  await screen.findByText('4 / 10');
  expect(records.days.get(today)?.waterIntakeMl).toBe(250);
  expect(records.days.get(today)?.meals[0]).toMatchObject({
    id: 'existing',
    calories: 300,
    protein: 50,
    pauta: {
      planVersion: 2,
      contributions: [{ group: 'protein', portions: 4 }],
    },
  });
  expect(records.account().nutritionPlan).not.toHaveProperty('applyToToday');
});

it('counts both exchange groups for manual legumes and native units for milk and scoops', async () => {
  const records = nutritionFixture({ ...testAccount, nutritionPlan: plan() });
  vi.stubGlobal('fetch', records.fetch);
  render(<App />);
  await screen.findByText('Avance de mi pauta');
  for (const [search, name, expectedUnit, expectedProtein] of [
    ['Lentejas', 'Lentejas / Garbanzos / Porotos (Cocidos)', 'g', 1],
    ['Leche', 'Leche Descremada', 'ml', undefined],
    ['Whey', 'Proteína Whey (1 Scoop)', 'scoop', 2],
  ] as const) {
    fireEvent.click(
      screen.getAllByRole('button', { name: /^Agregar alimento:/ })[0]
    );
    fireEvent.change(
      screen.getByPlaceholderText('Buscar pollo, arroz, avena, huevo...'),
      { target: { value: search } }
    );
    // Match catalog labels without depending on brands or extra label details.
    const label =
      screen.queryByText(name) ??
      screen
        .getAllByText(new RegExp(search, 'i'))
        .find((item) => item.tagName === 'SPAN');
    if (!label) throw new Error('Catalog food not found');
    fireEvent.click(label);
    fireEvent.click(screen.getByRole('button', { name: /^Registrar / }));
    await waitFor(() =>
      expect(records.days.get(getTodayDateString())?.meals).toHaveLength(
        expectedUnit === 'g' ? 1 : expectedUnit === 'ml' ? 2 : 3
      )
    );
    const entry = records.days.get(getTodayDateString())?.meals.at(-1);
    expect(entry?.quantity?.unit).toBe(expectedUnit);
    expect(entry?.pauta?.status).toBe('matched');
    if (expectedProtein)
      expect(entry?.pauta?.contributions[0].portions).toBe(expectedProtein);
    if (expectedUnit === 'g')
      expect(entry?.pauta?.contributions).toEqual([
        { group: 'protein', portions: 1 },
        { group: 'carbs', portions: 0.5 },
      ]);
  }
});

it.each(['foto', 'texto'])(
  'previews plan exchanges for %s and leaves unknown brands pending without losing grams',
  async (mode) => {
    const confirm = vi.fn<
      React.ComponentProps<typeof PlateAnalysisResultModal>['onConfirmPlate']
    >(async () => true);
    render(
      <PlateAnalysisResultModal
        isOpen
        analysis={analysis}
        defaultMealType="lunch"
        nutritionPlan={plan()}
        imageUrl={mode === 'foto' ? 'data:image/jpeg;base64,AA==' : ''}
        descriptionText={mode === 'texto' ? 'Mi almuerzo' : ''}
        onClose={() => undefined}
        onConfirmPlate={confirm}
      />
    );
    expect(screen.getByText('4 Proteínas')).toBeTruthy();
    expect(screen.getByText('0,45 Carbohidratos')).toBeTruthy();
    expect(screen.getByText('0,44 Grasas')).toBeTruthy();
    expect(screen.getByText(/Pendiente de clasificar/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: /Confirmar y Registrar/ })
    );
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(confirm.mock.calls[0][0].at(-1)).toMatchObject({
      amountGrams: 9,
      food: { name: 'Mayonesa Kraft' },
    });
  }
);

it('reviews an existing pending entry and persists an explicit equivalence without changing its nutrients', async () => {
  const records = nutritionFixture({ ...testAccount, nutritionPlan: plan() });
  const date = getTodayDateString();
  records.days.set(date, {
    date,
    waterIntakeMl: 0,
    meals: [
      {
        id: 'old',
        foodId: 'ai',
        foodName: 'Carne preparada',
        amountGrams: 200,
        calories: 400,
        protein: 50,
        carbs: 0,
        fat: 20,
        timestamp: '13:00',
        mealType: 'lunch',
      },
    ],
  });
  vi.stubGlobal('fetch', records.fetch);
  render(<App />);
  await screen.findByText('Avance de mi pauta');
  fireEvent.click(screen.getByRole('button', { name: 'Expandir Almuerzo' }));
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Asignar equivalencia de Carne preparada',
    })
  );
  const dialog = screen.getByRole('dialog', {
    name: 'Clasificar alimento en mi pauta',
  });
  fireEvent.change(
    within(dialog).getByLabelText('Buscar producto o equivalencia'),
    { target: { value: 'vacuno' } }
  );
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: /Elegir equivalencia:.*Vacuno/i,
    })
  );
  expect(within(dialog).getByText('4 Proteínas')).toBeTruthy();
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Guardar equivalencia' })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(records.days.get(date)?.meals[0]).toMatchObject({
    calories: 400,
    protein: 50,
    pauta: {
      status: 'matched',
      contributions: [{ group: 'protein', portions: 4 }],
    },
  });
});
