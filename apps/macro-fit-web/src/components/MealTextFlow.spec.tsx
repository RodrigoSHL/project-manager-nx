import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../app/app';
import { MealTextModal } from './MealTextModal';
import { PlateAnalysisResponse } from '../types/nutrition';

const analysis: PlateAnalysisResponse = {
  dish_name: 'Almuerzo descrito',
  plate_type_detected: 'plato_extendido',
  meal_type: 'lunch',
  total_estimated_kcal: 700,
  clinical_tip: '',
  assumptions: ['Harta ensalada: se estiman 150 g.'],
  items: [
    {
      name: 'Carne cocida',
      category: 'proteina',
      estimated_grams: 200,
      quantity_source: 'declared',
    },
    {
      name: 'Arroz cocido',
      category: 'carbohidrato',
      estimated_grams: 50,
      quantity_source: 'declared',
    },
    {
      name: 'Ensalada',
      category: 'verdura',
      estimated_grams: 150,
      quantity_source: 'estimated',
    },
    {
      name: 'Palta',
      category: 'grasa',
      estimated_grams: 40,
      quantity_source: 'declared',
    },
    {
      name: 'Mayonesa Kraft',
      category: 'grasa',
      estimated_grams: 9,
      quantity_source: 'declared',
    },
  ].map((item) => ({
    ...item,
    confidence: 'media',
    nutritional_density_per_100g: {
      kcal: 100,
      protein_g: 10,
      carbs_g: 5,
      fat_g: 3,
      fiber_g: 1,
    },
  })) as PlateAnalysisResponse['items'],
};

class MockRecognition {
  static current: MockRecognition;
  lang = '';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult:
    | ((event: {
        results: Array<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null = null;
  constructor() {
    MockRecognition.current = this;
  }
  start = vi.fn(() => this.onstart?.());
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  say(transcript: string, isFinal = false) {
    this.onresult?.({ results: [{ 0: { transcript }, isFinal }] });
  }
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('SpeechRecognition', undefined);
  vi.stubGlobal('webkitSpeechRecognition', undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('description to daily log', () => {
  it('reuses the review modal and saves all ingredients only on confirmation, preserving 9 g and decimal edits', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => analysis });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const key = Object.keys(localStorage).find((value) =>
      value.startsWith('macrofit_log_')
    )!;
    const previousMeals = JSON.parse(localStorage.getItem(key)!).meals;
    fireEvent.click(
      screen.getByRole('button', { name: 'Escribir / Dictar comida' })
    );
    expect(screen.getByText(/Este navegador no ofrece dictado/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('¿Qué comiste?'), {
      target: {
        value:
          'Almorcé 200 g de carne, 50 g de arroz, harta ensalada, 40 g de palta y 9 g de mayo Kraft.',
      },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Analizar descripción' })
    );
    const review = await screen.findByRole('dialog', {
      name: 'Revisar alimentos analizados',
    });
    expect(
      within(review).getByText('Harta ensalada: se estiman 150 g.')
    ).toBeTruthy();
    expect(
      within(review).getByText('Peso estimado · revisa los gramos')
    ).toBeTruthy();
    expect(
      (
        within(review).getByLabelText(
          'Gramos de Mayonesa Kraft'
        ) as HTMLInputElement
      ).value
    ).toBe('9');
    expect(JSON.parse(localStorage.getItem(key)!).meals).toEqual(previousMeals);
    fireEvent.change(
      within(review).getByLabelText('Gramos de Mayonesa Kraft'),
      { target: { value: '2.5' } }
    );
    fireEvent.click(
      within(review).getByRole('button', { name: /Confirmar y Registrar/ })
    );
    const saved = JSON.parse(localStorage.getItem(key)!).meals.slice(
      previousMeals.length
    );
    expect(saved).toHaveLength(5);
    expect(
      saved.every((meal: { mealType: string }) => meal.mealType === 'lunch')
    ).toBe(true);
    expect(
      saved.map((meal: { amountGrams: number }) => meal.amountGrams)
    ).toEqual([200, 50, 150, 40, 2.5]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the draft editable after provider failure and sends the explicitly selected meal', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Gemini temporalmente no disponible' }),
      });
    vi.stubGlobal('fetch', fetch);
    const success = vi.fn();
    render(
      <MealTextModal
        defaultMealType="dinner"
        onClose={vi.fn()}
        onAnalysisSuccess={success}
      />
    );
    fireEvent.change(screen.getByLabelText('¿Qué comiste?'), {
      target: { value: '200 g de carne' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Analizar descripción' })
    );
    await screen.findByText('Gemini temporalmente no disponible');
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).value
    ).toBe('200 g de carne');
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).disabled
    ).toBe(false);
    expect(JSON.parse(fetch.mock.calls[0][1].body).mealType).toBe('dinner');
    expect(success).not.toHaveBeenCalled();
  });

  it('ignores late results and aborts the request when the form is closed', async () => {
    let resolve!: (value: unknown) => void;
    const fetch = vi.fn().mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    vi.stubGlobal('fetch', fetch);
    const success = vi.fn();
    const { unmount } = render(
      <MealTextModal onClose={vi.fn()} onAnalysisSuccess={success} />
    );
    fireEvent.change(screen.getByLabelText('¿Qué comiste?'), {
      target: { value: '200 g de carne' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Analizar descripción' })
    );
    const signal = fetch.mock.calls[0][1].signal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => resolve({ ok: true, json: async () => analysis }));
    expect(success).not.toHaveBeenCalled();
  });
});

describe('browser dictation', () => {
  beforeEach(() => vi.stubGlobal('webkitSpeechRecognition', MockRecognition));

  it('replaces interim transcripts without duplicating words, appends to the draft and does not auto-submit', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<MealTextModal onClose={vi.fn()} onAnalysisSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('¿Qué comiste?'), {
      target: { value: 'Almorcé' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dictar comida' }));
    const mic = MockRecognition.current;
    expect(mic.lang).toBe('es-CL');
    act(() => mic.say('200 gramos'));
    act(() => mic.say('200 gramos de carne', true));
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).value
    ).toBe('Almorcé 200 gramos de carne');
    expect(
      (
        screen.getByRole('button', {
          name: 'Analizar descripción',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Detener dictado' }));
    await waitFor(() =>
      expect(
        (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).disabled
      ).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dictar comida' }));
    act(() => MockRecognition.current.say('y 9 gramos de mayo', true));
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).value
    ).toBe('Almorcé 200 gramos de carne y 9 gramos de mayo');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the draft and allows typing after a microphone permission error', () => {
    render(<MealTextModal onClose={vi.fn()} onAnalysisSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('¿Qué comiste?'), {
      target: { value: '200 g de carne' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dictar comida' }));
    act(() => MockRecognition.current.onerror?.({ error: 'not-allowed' }));
    expect(screen.getByRole('alert').textContent).toContain(
      'Permite el micrófono'
    );
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).value
    ).toBe('200 g de carne');
    expect(
      (screen.getByLabelText('¿Qué comiste?') as HTMLTextAreaElement).disabled
    ).toBe(false);
  });

  it('stops the microphone and detaches events when the modal unmounts', () => {
    const { unmount } = render(
      <MealTextModal onClose={vi.fn()} onAnalysisSuccess={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dictar comida' }));
    const mic = MockRecognition.current;
    unmount();
    expect(mic.abort).toHaveBeenCalled();
    expect(mic.onresult).toBeNull();
    expect(mic.onend).toBeNull();
  });
});
