import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  TRAINING_CATALOG,
  type CompletedTraining,
} from '@project-manager/macrofit-contracts';
import { TrainingProgress } from './TrainingProgress';
import { trainingApi } from './training-api';

vi.mock('../../hooks/useMacroStore', () => ({
  getTodayDateString: () => '2026-11-13',
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function session(
  id: string,
  performedOn: string,
  exerciseId: string
): CompletedTraining {
  const exercise = TRAINING_CATALOG.find(({ id }) => id === exerciseId)!;
  return {
    id,
    performedOn,
    revision: 0,
    startedAt: '',
    finishedAt: '',
    exercises: [
      {
        exercise,
        sets:
          exercise.kind === 'cardio'
            ? [{ id, durationMinutes: 20 }]
            : [{ id, reps: 10, weightKg: 30 }],
      },
    ],
  };
}

it('colors gaps at 7 and 30 days and accumulates past sessions across pages', async () => {
  const latest = session('recent', '2026-11-13', 'bench-press');
  const second = session('six-days', '2026-11-07', 'bench-press');
  const history = vi
    .spyOn(trainingApi, 'history')
    .mockImplementation(async (offset) =>
      offset === 0
        ? {
            sessions: [
              session('future', '2026-11-14', 'leg-extension'),
              latest,
              session('bike', '2026-11-13', 'stationary-bike'),
              second,
            ],
            nextOffset: 4,
          }
        : {
            sessions: [
              session('seven-days', '2026-11-06', 'leg-extension'),
              session('thirty-days', '2026-10-14', 'leg-curl'),
            ],
            nextOffset: null,
          }
    );
  const openSession = vi.fn();
  const { rerender } = render(
    <TrainingProgress live={latest} onOpenSession={openSession} />
  );

  const quads = await screen.findByRole('button', {
    name: 'Cuádriceps · Último registro hace 7 días',
  });
  expect(quads.querySelectorAll('[data-intensity="week"]')).toHaveLength(2);
  const hamstrings = screen.getByRole('button', {
    name: 'Isquiotibiales · Último registro hace 30 días',
  });
  expect(hamstrings.querySelectorAll('[data-intensity="month"]')).toHaveLength(
    2
  );
  expect(
    screen.getByRole('button', { name: 'Tibiales · Sin registros de fuerza' })
  ).toBeTruthy();
  expect(history).toHaveBeenCalledWith(4);

  fireEvent.click(screen.getByRole('button', { name: '7 días' }));
  expect(
    screen.getByRole('button', { name: 'Pectorales · 2 series equivalentes' })
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Cuádriceps · 0 series equivalentes' })
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '30 días' }));
  expect(
    screen.getByRole('button', {
      name: 'Isquiotibiales · 0 series equivalentes',
    })
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Cuádriceps · 1 serie equivalente' })
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Todo' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Isquiotibiales · 1 serie equivalente' })
  );
  expect(screen.getByText('14 de octubre de 2026')).toBeTruthy();

  rerender(
    <TrainingProgress
      live={session('draft', '2026-11-13', 'leg-extension')}
      onOpenSession={openSession}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Último registro' }));
  expect(
    screen.getByRole('button', { name: 'Cuádriceps · Último registro hoy' })
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ir a sesión' }));
  expect(openSession).toHaveBeenCalledOnce();
});
