import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MacroFitWorkspace } from './app';
import {
  nutritionFixture,
  testAccount,
  testToken,
} from '../testing/nutrition-fixture';
import { getTodayDateString } from '../hooks/useMacroStore';

const user = {
  userId: 'workspace-test',
  name: 'Test',
  email: 'test@example.invalid',
  roles: ['user'],
};
const App = () => <MacroFitWorkspace user={user} onLogout={() => undefined} />;

describe('MacroFit database workspace', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('macrofit_access_token', testToken());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  it('starts a new account without fabricated biometrics, goals or a clinician', async () => {
    const records = nutritionFixture({
      ...testAccount,
      profile: null,
      goals: null,
    });
    vi.stubGlobal('fetch', records.fetch);
    render(<App />);
    await screen.findByRole('heading', { name: 'Configura tu perfil' });
    expect(screen.queryByText('Registrar comida con IA')).toBeNull();
    expect(screen.queryByText(/Paciente MEDS|Fluxá|1990/)).toBeNull();
    expect((screen.getByLabelText('Peso (kg)') as HTMLInputElement).value).toBe(
      ''
    );
    expect(localStorage.length).toBe(0);
    expect(
      records.fetch.mock.calls.every(([path]) =>
        path.startsWith('/api/macrofit/me')
      )
    ).toBe(true);
  });
  it('shows a load error instead of inventing an empty profile when the response is malformed', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path === '/api/macrofit/me'
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
        : records.fetch(path, init)
    );
    render(<App />);
    await screen.findByText('El servidor no entregó registros válidos.');
    expect(
      screen.queryByRole('heading', { name: 'Configura tu perfil' })
    ).toBeNull();
    expect(screen.queryByText('Registrar comida con IA')).toBeNull();
  });
  it('saves a reusable combo to the server including its nutritional snapshot', async () => {
    const records = nutritionFixture();
    records.days.set(getTodayDateString(), {
      date: getTodayDateString(),
      waterIntakeMl: 0,
      meals: [
        {
          id: 'entry-1',
          mealType: 'breakfast',
          foodId: 'ai-food',
          foodName: 'Avena',
          amountGrams: 40,
          calories: 145,
          protein: 5.5,
          carbs: 27,
          fat: 2.8,
          timestamp: '08:00',
        },
      ],
    });
    vi.stubGlobal('fetch', records.fetch);
    render(<App />);
    await screen.findByText('Registrar comida con IA');
    fireEvent.click(screen.getAllByRole('button', { name: /^Combos:/ })[0]);
    fireEvent.click(screen.getByText('Guardar actual como combo'));
    fireEvent.change(
      screen.getByPlaceholderText(
        'Nombre del combo (Ej: Mi Almuerzo Favorito)'
      ),
      { target: { value: 'Desayuno de prueba' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Combo' }));
    await waitFor(() =>
      expect(records.account().customTemplates).toHaveLength(1)
    );
    expect(records.account().customTemplates[0]).toMatchObject({
      name: 'Desayuno de prueba',
      mealType: 'breakfast',
      items: [
        {
          foodId: 'ai-food',
          amountGrams: 40,
          food: { name: 'Avena', calories: 145 },
        },
      ],
    });
    expect(localStorage.length).toBe(0);
  });
  it('does not show a successful save when PostgreSQL is unavailable', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.endsWith('/settings')
        ? Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ message: 'Base no disponible' }),
          })
        : records.fetch(path, init)
    );
    render(<App />);
    await screen.findByText('Registrar comida con IA');
    fireEvent.click(screen.getByRole('button', { name: 'Planificación' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Calculadora' })[0]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Aplicar a Mis Metas Diarias' })
    );
    await screen.findByText(/Base no disponible/);
    expect(screen.queryByText('¡Metas Actualizadas con Éxito!')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Actualizar registros' })
    ).toBeTruthy();
    expect(localStorage.length).toBe(0);
  });
});
