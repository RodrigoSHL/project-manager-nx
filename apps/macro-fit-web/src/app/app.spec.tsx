import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

describe('App', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should render MacroFit title and navigation', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(getAllByText(/Macro/i).length).toBeGreaterThan(0);
  });

  it('saves the selected meal as a reusable combo with its current foods', () => {
    render(<App />);
    const dailyKey = Object.keys(localStorage).find((key) =>
      key.startsWith('macrofit_log_')
    )!;
    const entries = JSON.parse(localStorage.getItem(dailyKey)!).meals.filter(
      (entry: { mealType: string }) => entry.mealType === 'breakfast'
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Combos' })[0]);
    fireEvent.click(screen.getByText('Guardar actual como combo'));
    fireEvent.change(
      screen.getByPlaceholderText(
        'Nombre del combo (Ej: Mi Almuerzo Favorito)'
      ),
      {
        target: { value: 'Desayuno de prueba' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Combo' }));
    const saved = JSON.parse(
      localStorage.getItem('macrofit_custom_templates')!
    )[0];
    expect(saved.name).toBe('Desayuno de prueba');
    expect(saved.mealType).toBe('breakfast');
    expect(saved.items).toEqual(
      entries.map((entry: { foodId: string; amountGrams: number }) => ({
        foodId: entry.foodId,
        amountGrams: entry.amountGrams,
      }))
    );
    expect(saved.items.length).toBeGreaterThan(0);
  });
});
