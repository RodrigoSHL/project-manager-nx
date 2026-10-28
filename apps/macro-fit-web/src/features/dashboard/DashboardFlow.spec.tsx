import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardView, { rangeStart } from './DashboardView';
import { MacroFitWorkspace } from '../../app/app';
import { createPautaTemplate, NutritionPlan } from '../../types/nutrition';
import { nutritionFixture, testToken } from '../../testing/nutrition-fixture';

// Chart geometry is checked in the browser; these tests exercise data and user flows.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: () => <div data-testid="chart" />,
  Line: () => null,
  ReferenceLine: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fixture() {
  const records = nutritionFixture();
  const plan: NutritionPlan = {
    ...createPautaTemplate('2026-10-01'),
    enabled: true,
    version: 1,
    createdAt: '2026-10-01T00:00:00Z',
  };
  records.days.set('2026-10-02', {
    date: '2026-10-02',
    nutritionPlan: plan,
    waterIntakeMl: 500,
    meals: [
      {
        id: 'meal',
        foodId: 'food',
        foodName: 'Test',
        mealType: 'lunch',
        timestamp: '13:00',
        amountGrams: 200,
        calories: 2200,
        protein: 150,
        carbs: 200,
        fat: 60,
        pauta: {
          planVersion: 1,
          status: 'matched',
          contributions: [{ group: 'protein', portions: 4 }],
        },
      },
      {
        id: 'pending',
        foodId: 'unknown',
        foodName: 'Unknown',
        mealType: 'lunch',
        timestamp: '13:00',
        amountGrams: 10,
        calories: 100,
        protein: 0,
        carbs: 10,
        fat: 5,
      },
    ],
  });
  vi.stubGlobal('fetch', records.fetch);
  return records;
}
describe('Dashboard', () => {
  it('uses recorded days for averages, exposes excesses and partial portions, and opens the chosen diary', async () => {
    const records = fixture();
    const onOpenDiary = vi.fn();
    render(<DashboardView date="2026-10-02" onOpenDiary={onOpenDiary} />);
    expect((await screen.findAllByText('2.300 kcal')).length).toBe(2);
    expect(screen.getByText('1 / 7')).toBeTruthy();
    expect(screen.getByText('1 día')).toBeTruthy();
    expect(
      screen.getByText(/Avance parcial: 1 alimento pendiente/)
    ).toBeTruthy();
    expect(screen.getByText('200 kcal sobre objetivo')).toBeTruthy();
    expect(screen.getByText(/no se conserva un historial/)).toBeTruthy();
    const detail = screen.getByRole('region', { name: 'Detalle de un día' });
    expect(within(detail).getByText('4 porciones')).toBeTruthy();
    expect(within(detail).getByText('Objetivo: 10 porciones')).toBeTruthy();
    fireEvent.click(
      screen.getByText('Ver registros y valores de los gráficos')
    );
    expect(screen.getByRole('table')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Abrir este día en el diario' })
    );
    expect(onOpenDiary).toHaveBeenCalledWith('2026-10-02');
    fireEvent.change(screen.getByLabelText('Período'), {
      target: { value: '30' },
    });
    await waitFor(() =>
      expect(
        records.fetch.mock.calls.some(([path]) =>
          path.endsWith('from=2026-09-03&to=2026-10-02')
        )
      ).toBe(true)
    );
    expect(localStorage.length).toBe(0);
    expect(
      records.fetch.mock.calls.every(
        ([, init]) => !init?.method || init.method === 'GET'
      )
    ).toBe(true);
  });
  it('shows an honest empty state and a retry after a bad server response', async () => {
    const records = nutritionFixture();
    records.fetch.mockRejectedValueOnce(
      new Error('Servicio temporalmente no disponible')
    );
    vi.stubGlobal('fetch', records.fetch);
    render(<DashboardView date="2026-10-02" onOpenDiary={vi.fn()} />);
    await screen.findByRole('alert');
    expect(screen.queryByText('0 kcal')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText(/Todavía no hay comidas/);
    expect(screen.getByText('0 / 7')).toBeTruthy();
    expect(
      screen.getByText(/Sin comidas registradas. No se interpreta/)
    ).toBeTruthy();
    expect(screen.getByText(/No hay pauta activa/)).toBeTruthy();
  });
  it('is reachable from the diary and sidebar, without replacing the diary as the initial screen', async () => {
    fixture();
    render(
      <MacroFitWorkspace
        user={{
          userId: 'dashboard-test',
          name: 'Test',
          email: 'test@example.invalid',
          roles: ['user'],
        }}
        onLogout={vi.fn()}
      />
    );
    await screen.findByText('Registrar comida con IA');
    fireEvent.click(screen.getByRole('button', { name: 'Ver mi seguimiento' }));
    await screen.findByRole('heading', { name: 'Mi seguimiento' });
    await screen.findByText('Días con comidas');
    expect(
      screen
        .getByRole('button', { name: 'Mi seguimiento' })
        .getAttribute('aria-current')
    ).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar comida' }));
    await screen.findByText('Registrar comida con IA');
  });
  it('calculates inclusive calendar windows across year boundaries', () => {
    expect(rangeStart('2026-01-03', 7)).toBe('2025-12-28');
    expect(rangeStart('2024-03-01', 7)).toBe('2024-02-24');
  });
});
