import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sun } from 'lucide-react';
import { MacroFitWorkspace } from '../app/app';
import { nutritionFixture, testToken } from '../testing/nutrition-fixture';
import { MealSection } from './MealSection';
import { MealEntry } from '../types/nutrition';

const user = {
  userId: 'layout-test',
  name: 'Rodrigo Catalán',
  email: 'layout@example.invalid',
  roles: ['user'],
};
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
  vi.stubGlobal('fetch', nutritionFixture().fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Workspace navigation', () => {
  it('moves modules into the sidebar and provides a real profile and settings destination', async () => {
    const logout = vi.fn();
    render(<MacroFitWorkspace user={user} onLogout={logout} />);
    await screen.findByText('Registrar comida con IA');
    const nav = screen.getByRole('navigation', { name: 'Módulos de MacroFit' });
    expect(
      within(nav)
        .getByRole('button', { name: 'Diario' })
        .getAttribute('aria-current')
    ).toBe('page');
    fireEvent.click(
      screen.getByRole('button', { name: 'Ver perfil de Rodrigo Catalán' })
    );
    await screen.findByRole('heading', { name: 'Mi perfil' });
    expect(screen.getAllByText('layout@example.invalid').length).toBeTruthy();
    expect(screen.getByText('65 kg')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Editar datos y metas' })
    );
    expect(
      screen.getByRole('button', { name: 'Aplicar a Mis Metas Diarias' })
    ).toBeTruthy();
    fireEvent.click(within(nav).getByRole('button', { name: 'Configuración' }));
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Catálogo personal/ }));
    expect(screen.getByRole('heading', { name: 'Mis productos' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
  });
  it('closes the mobile menu on navigation or Escape, restores focus and unlocks scrolling', async () => {
    render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
    await screen.findByText('Registrar comida con IA');
    const menu = screen.getByRole('button', {
      name: 'Abrir menú de navegación',
    });
    menu.focus();
    fireEvent.click(menu);
    const drawer = screen.getByRole('dialog', {
      name: 'Navegación de MacroFit',
    });
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(
      within(drawer).getByRole('button', { name: 'Cerrar menú de navegación' })
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(document.activeElement).toBe(menu);
    fireEvent.click(menu);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Mis productos',
      })
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('heading', { name: 'Mis productos' })).toBeTruthy();
  });
  it('keeps selecting diary dates functional after relocating the calendar', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', records.fetch);
    render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
    await screen.findByText('Registrar comida con IA');
    fireEvent.change(screen.getByLabelText('Fecha del diario'), {
      target: { value: '2026-10-01' },
    });
    await waitFor(() =>
      expect(
        records.fetch.mock.calls.some(([path]) =>
          path.endsWith('/days/2026-10-01')
        )
      ).toBe(true)
    );
    expect(
      (screen.getByLabelText('Fecha del diario') as HTMLInputElement).value
    ).toBe('2026-10-01');
  });
});

describe('Collapsible meal sections', () => {
  const first: MealEntry = {
    id: 'one',
    mealType: 'lunch',
    foodId: 'food',
    foodName: 'Alimento con un nombre largo para revisar el diario',
    amountGrams: 100,
    calories: 180,
    protein: 12,
    carbs: 20,
    fat: 6,
    timestamp: '13:00',
  };
  it('keeps totals and all four icon actions available while collapsed, targeting the correct meal', () => {
    const add = vi.fn(),
      text = vi.fn(),
      scan = vi.fn(),
      combos = vi.fn();
    render(
      <MealSection
        mealType="lunch"
        title="Almuerzo"
        subtitle="Alimentos registrados"
        icon={Sun}
        entries={[first]}
        onOpenAddFood={add}
        onOpenTextMeal={text}
        onOpenScanPlate={scan}
        onOpenTemplates={combos}
        onRemoveEntry={vi.fn()}
      />
    );
    const expand = screen.getByRole('button', { name: 'Expandir Almuerzo' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('1 alimento · 180 kcal')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: `Eliminar ${first.foodName}` })
    ).toBeNull();
    const actions = within(
      screen.getByRole('group', { name: 'Acciones de Almuerzo' })
    ).getAllByRole('button');
    expect(actions).toHaveLength(4);
    expect(actions.every((button) => !button.textContent?.trim())).toBe(true);
    fireEvent.click(
      screen.getByRole('button', { name: 'Describir comida: Almuerzo' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Escanear plato: Almuerzo' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Combos: Almuerzo' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar alimento: Almuerzo' })
    );
    for (const callback of [add, text, scan, combos])
      expect(callback).toHaveBeenCalledWith('lunch');
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expand);
    expect(
      screen.getByRole('button', { name: `Eliminar ${first.foodName}` })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Contraer Almuerzo' }));
    expect(
      screen.queryByRole('button', { name: `Eliminar ${first.foodName}` })
    ).toBeNull();
  });
  it('opens a meal automatically after adding food and preserves the collapsed state on ordinary refreshes', () => {
    const props = {
      mealType: 'lunch' as const,
      title: 'Almuerzo',
      subtitle: '',
      icon: Sun,
      onOpenAddFood: vi.fn(),
      onRemoveEntry: vi.fn(),
    };
    const view = render(<MealSection {...props} entries={[]} />);
    view.rerender(<MealSection {...props} entries={[first]} />);
    expect(
      screen.getByRole('button', { name: 'Contraer Almuerzo' })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Contraer Almuerzo' }));
    view.rerender(
      <MealSection {...props} entries={[{ ...first, calories: 200 }]} />
    );
    expect(
      screen.getByRole('button', { name: 'Expandir Almuerzo' })
    ).toBeTruthy();
    expect(screen.getByText('1 alimento · 200 kcal')).toBeTruthy();
  });
});
