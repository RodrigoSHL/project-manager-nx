import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  TRAINING_CATALOG,
  type CompletedTraining,
} from '@project-manager/macrofit-contracts';
import { TrainingPeriodMap } from './TrainingPeriodMap';
import { trainingApi } from './training-api';

vi.mock('../../hooks/useMacroStore', () => ({
  getTodayDateString: () => '2026-11-13',
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('sums all sessions in the selected day or week, including the active draft only once', async () => {
  const exercise = TRAINING_CATALOG.find(({ id }) => id === 'leg-extension')!;
  const session = (id: string, performedOn: string): CompletedTraining => ({
    id,
    performedOn,
    revision: 0,
    startedAt: '',
    finishedAt: '',
    exercises: [{ exercise, sets: [{ id, reps: 10, weightKg: 30 }] }],
  });
  const monday = session('monday', '2026-11-09');
  const friday = session('friday', '2026-11-13');
  const lastWeek = session('past', '2026-11-08');
  const history = vi
    .spyOn(trainingApi, 'history')
    .mockImplementation(async (offset, range) => {
      const sessions = [friday, monday, lastWeek].filter(
        ({ performedOn }) =>
          !range || (performedOn >= range.from && performedOn <= range.to)
      );
      return {
        sessions: sessions.slice(offset, offset + 1),
        nextOffset: offset + 1 < sessions.length ? offset + 1 : null,
      };
    });
  const { rerender } = render(
    <TrainingPeriodMap
      defaultDay={friday.performedOn}
      latest={friday}
      live={{ ...friday, id: 'draft' }}
    />
  );

  const quads = (count: string) =>
    within(
      screen.getByRole('group', { name: 'Vista muscular: Frente' })
    ).findByRole('button', {
      name: new RegExp('^Cuádriceps · ' + count + ' '),
    });

  await quads('2');
  fireEvent.click(screen.getByRole('button', { name: 'Acumulado semanal' }));
  await quads('3');
  expect(history).toHaveBeenCalledWith(1, {
    from: '2026-11-09',
    to: '2026-11-15',
  });
  fireEvent.click(screen.getByText('Sin series registradas (16)'));
  expect(screen.getByText(/^Pectorales · Deltoides/)).toBeTruthy();

  rerender(
    <TrainingPeriodMap
      defaultDay={friday.performedOn}
      latest={friday}
      live={null}
    />
  );
  await quads('2');
  fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
  await quads('1');
  expect(history).toHaveBeenCalledWith(0, {
    from: '2026-11-02',
    to: '2026-11-08',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Por día' }));
  fireEvent.change(screen.getByLabelText('Día del mapa'), {
    target: { value: '2026-11-12' },
  });
  await quads('0');
  expect(history).toHaveBeenCalledWith(0, {
    from: '2026-11-12',
    to: '2026-11-12',
  });
});
