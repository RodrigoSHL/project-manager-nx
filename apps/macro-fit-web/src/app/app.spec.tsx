import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MacroFitWorkspace } from './app';
import { accountKey } from '../features/auth/account-storage';
import { getTodayDateString } from '../hooks/useMacroStore';

const user = {
  userId: 'workspace-test',
  name: 'Test',
  email: 'test@example.invalid',
  roles: ['user'],
};
const App = () => <MacroFitWorkspace user={user} onLogout={() => undefined} />;

describe('MacroFit workspace', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());
  it('renders the account workspace and an empty daily log for a new account', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
    expect(screen.getAllByText(/Macro/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    expect(
      screen.queryByText('Pechuga de Pollo a la plancha (200g cocido)')
    ).toBeNull();
  });
  it('saves a reusable combo inside the current account', () => {
    const entry = {
      id: 'entry-1',
      mealType: 'breakfast',
      foodId: 'meds-avena',
      foodName: 'Avena',
      amountGrams: 40,
      calories: 145,
      protein: 5.5,
      carbs: 27,
      fat: 2.8,
      timestamp: '08:00',
    };
    localStorage.setItem(
      accountKey(user.userId, `macrofit_log_${getTodayDateString()}`),
      JSON.stringify({
        date: getTodayDateString(),
        meals: [entry],
        waterIntakeMl: 0,
      })
    );
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Combos' })[0]);
    fireEvent.click(screen.getByText('Guardar actual como combo'));
    fireEvent.change(
      screen.getByPlaceholderText(
        'Nombre del combo (Ej: Mi Almuerzo Favorito)'
      ),
      { target: { value: 'Desayuno de prueba' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Combo' }));
    const saved = JSON.parse(
      localStorage.getItem(
        accountKey(user.userId, 'macrofit_custom_templates')
      )!
    )[0];
    expect(saved).toMatchObject({
      name: 'Desayuno de prueba',
      mealType: 'breakfast',
      items: [{ foodId: 'meds-avena', amountGrams: 40 }],
    });
    expect(localStorage.getItem('macrofit_custom_templates')).toBeNull();
  });
});
