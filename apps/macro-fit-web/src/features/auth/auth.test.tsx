import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/app';
import {
  authenticatedFetch,
  getAccessToken,
  setAccessToken,
} from './auth-session';
import { withRecords } from '../../testing/nutrition-fixture';
import { analyzeMealText } from '../../utils/plateAnalysisApi';

const userA = {
  userId: 'account-a',
  name: 'Cuenta A',
  email: 'a@example.invalid',
  roles: ['user'],
};
const userB = {
  ...userA,
  userId: 'account-b',
  name: 'Cuenta B',
  email: 'b@example.invalid',
};
const defaultExpiry = Math.floor(Date.now() / 1000) + 3600;
const token = (id = userA.userId, exp = defaultExpiry) =>
  `test.${btoa(JSON.stringify({ sub: id, exp }))}.signature`;
const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}
const mount = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>
  );
function credentials() {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: '  A@EXAMPLE.INVALID  ' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'test-only-password' },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Iniciar sesión' }).closest('form')!
  );
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('platform login', () => {
  it('redirects anonymous visitors without exposing diary data', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', withRecords(fetch));
    mount('/?view=tracker#today');
    await screen.findByRole('heading', { name: 'Inicia sesión' });
    expect(screen.getByTestId('location').textContent).toContain(
      '/login?redirect='
    );
    expect(screen.queryByText('Registrar comida con IA')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('normalizes email, validates the profile, and rejects an external redirect', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ access_token: token(), user: userA }))
      .mockResolvedValueOnce(response(userA));
    vi.stubGlobal('fetch', withRecords(fetch));
    mount('/login?redirect=https%3A%2F%2Fevil.example%2F');
    await screen.findByRole('button', { name: 'Iniciar sesión' });
    credentials();
    await screen.findByText('Registrar comida con IA');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      email: 'a@example.invalid',
      password: 'test-only-password',
    });
    expect(fetch.mock.calls[1][0]).toBe('/api/auth/profile');
    expect(fetch.mock.calls[1][1].cache).toBe('no-store');
    expect(screen.getByTestId('location').textContent).toBe('/');
    expect(getAccessToken()).toBe(token());
  });
  it('shows credential failures and never opens the diary', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 401)));
    mount('/login');
    credentials();
    await screen.findByText('Correo o contraseña incorrectos.');
    expect(getAccessToken()).toBeNull();
    expect(screen.queryByText('Registrar comida con IA')).toBeNull();
  });
  it('restores a tab session and logs out without a local personal data copy', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    vi.stubGlobal(
      'fetch',
      withRecords(vi.fn().mockResolvedValue(response(userA)))
    );
    mount();
    await screen.findByText('Registrar comida con IA');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByRole('heading', { name: 'Inicia sesión' });
    expect(getAccessToken()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
  it.each(['expired', 'invalid', 'server-rejected'])(
    'rejects a %s session',
    async (kind) => {
      sessionStorage.setItem(
        'macrofit_access_token',
        kind === 'expired'
          ? token(userA.userId, 1)
          : kind === 'invalid'
          ? 'broken'
          : token()
      );
      const fetch = vi.fn().mockResolvedValue(response({}, 401));
      vi.stubGlobal('fetch', withRecords(fetch));
      mount();
      await screen.findByRole('heading', { name: 'Inicia sesión' });
      expect(getAccessToken()).toBeNull();
      if (kind !== 'server-rejected') expect(fetch).not.toHaveBeenCalled();
    }
  );
  it('keeps the token but hides data while profile validation is unavailable, then retries', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(response(userA));
    vi.stubGlobal('fetch', withRecords(fetch));
    mount();
    await screen.findByRole('button', { name: 'Reintentar conexión' });
    expect(getAccessToken()).toBe(token());
    expect(screen.queryByText('Registrar comida con IA')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Reintentar conexión' })
    );
    await screen.findByText('Registrar comida con IA');
  });
  it('ignores an old profile response after a session change', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    let resolveA!: (value: unknown) => void;
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveA = resolve;
          })
      )
      .mockResolvedValueOnce(response(userB));
    vi.stubGlobal('fetch', withRecords(fetch));
    mount();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    act(() => {
      sessionStorage.setItem('macrofit_access_token', token(userB.userId));
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'macrofit_access_token' })
      );
    });
    await screen.findByRole('button', { name: 'Cerrar sesión' });
    await act(async () => resolveA(response(userA)));
    expect(
      screen
        .getByRole('button', { name: 'Cerrar sesión' })
        .getAttribute('title')
    ).toContain('Cuenta B');
  });
  it('closes an authenticated view when the JWT expires without waiting for an API call', async () => {
    vi.useFakeTimers();
    const expires = Math.floor(Date.now() / 1000) + 60;
    sessionStorage.setItem(
      'macrofit_access_token',
      token(userA.userId, expires)
    );
    vi.stubGlobal(
      'fetch',
      withRecords(vi.fn().mockResolvedValue(response(userA)))
    );
    await act(async () => {
      mount();
    });
    expect(screen.getByText('Registrar comida con IA')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61000);
    });
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeTruthy();
    expect(getAccessToken()).toBeNull();
  });
});

describe('authenticated analyses', () => {
  it('discards a response body that arrives after switching accounts', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    let finish!: (body: unknown) => void;
    let reading!: () => void;
    const bodyStarted = new Promise<void>((resolve) => {
      reading = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => {
          reading();
          return new Promise((resolve) => {
            finish = resolve;
          });
        },
      })
    );
    const pending = analyzeMealText('200 g de arroz');
    const assertion = expect(pending).rejects.toThrow('sesión cambió');
    await bodyStarted;
    setAccessToken(token(userB.userId));
    finish({ items: ['old-account-result'] });
    await assertion;
    expect(getAccessToken()).toBe(token(userB.userId));
  });
  it('adds a Bearer token and preserves the session on 403', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    const fetch = vi.fn().mockResolvedValue(response({}, 403));
    vi.stubGlobal('fetch', withRecords(fetch));
    expect(
      (await authenticatedFetch('/api/macrofit/analyze-meal-text')).status
    ).toBe(403);
    expect(
      new Headers(fetch.mock.calls[0][1].headers).get('Authorization')
    ).toBe(`Bearer ${token()}`);
    expect(getAccessToken()).toBe(token());
  });
  it('clears the session on 401', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 401)));
    expect(
      (await authenticatedFetch('/api/macrofit/analyze-meal-text')).status
    ).toBe(401);
    expect(getAccessToken()).toBeNull();
  });
  it('does not send an anonymous provider request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', withRecords(fetch));
    await expect(
      authenticatedFetch('/api/macrofit/analyze-meal-text')
    ).rejects.toThrow('sesión expiró');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('discards an old request without clearing a newer session', async () => {
    sessionStorage.setItem('macrofit_access_token', token());
    let done!: (value: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            done = resolve;
          })
      )
    );
    const pending = authenticatedFetch('/api/macrofit/analyze-meal-text');
    const assertion = expect(pending).rejects.toThrow('sesión cambió');
    setAccessToken(token(userB.userId));
    done(response({}, 401));
    await assertion;
    expect(getAccessToken()).toBe(token(userB.userId));
  });
});
