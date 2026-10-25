import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PwaUpdatePrompt } from './PwaUpdatePrompt';

const pwa = vi.hoisted(() => ({
  available: false,
  update: vi.fn(),
  options: null as any,
}));
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options: unknown) => {
    pwa.options = options;
    return {
      needRefresh: [pwa.available, vi.fn()],
      updateServiceWorker: pwa.update,
    };
  },
}));
beforeEach(() => {
  pwa.available = false;
  pwa.update.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('appears only for a waiting version and never reloads without an explicit click', async () => {
  const { rerender } = render(<PwaUpdatePrompt />);
  expect(screen.queryByText('Nueva versión disponible')).toBeNull();
  pwa.available = true;
  rerender(<PwaUpdatePrompt />);
  expect(screen.getByText(/Guarda tus cambios/)).toBeTruthy();
  expect(pwa.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Recordarme más tarde' }));
  expect(screen.queryByText(/Guarda tus cambios/)).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Nueva versión disponible' })
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }))
  );
  expect(pwa.update).toHaveBeenCalledOnce();
  expect(pwa.update).toHaveBeenCalledWith(true);
});
it('allows retry when activation fails', async () => {
  pwa.available = true;
  pwa.update.mockRejectedValueOnce(new Error('offline'));
  render(<PwaUpdatePrompt />);
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }))
  );
  expect(screen.getByRole('alert').textContent).toContain(
    'No se pudo actualizar'
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }))
  );
  expect(pwa.update).toHaveBeenCalledTimes(2);
});
it('checks on return and periodically, throttles events, skips offline and cleans up', async () => {
  vi.useFakeTimers();
  const update = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const visibility = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('visible');
  const { unmount } = render(<PwaUpdatePrompt />);
  pwa.options.onRegisteredSW('/sw.js', { update });
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(update).toHaveBeenCalledOnce();
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(update).toHaveBeenCalledOnce();
  await act(async () => vi.advanceTimersByTimeAsync(5 * 60000));
  expect(update).toHaveBeenCalledTimes(2);
  visibility.mockReturnValue('hidden');
  await act(async () => vi.advanceTimersByTimeAsync(5 * 60000));
  expect(update).toHaveBeenCalledTimes(2);
  visibility.mockReturnValue('visible');
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(update).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => vi.advanceTimersByTimeAsync(5 * 60000));
  expect(update).toHaveBeenCalledTimes(2);
});
