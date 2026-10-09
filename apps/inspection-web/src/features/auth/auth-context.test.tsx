import 'fake-indexeddb/auto';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  profile: vi.fn(),
  apiReachable: false,
}));
vi.mock('./auth-api', async (original) => ({
  ...(await original<typeof import('./auth-api')>()),
  authApi: { login: mocks.login, profile: mocks.profile },
}));
vi.mock('../../hooks/use-connectivity', () => ({
  useConnectivity: () => ({
    apiReachable: mocks.apiReachable,
    browserOnline: true,
  }),
}));
const descriptor = Object.getOwnPropertyDescriptor(window, 'location');
const replace = vi.fn();
const reload = vi.fn();
const databases: Dexie[] = [];
function token(userId: string) {
  return `header.${btoa(
    JSON.stringify({
      sub: userId,
      email: `${userId}@example.com`,
      roles: ['user'],
      exp: 4102444800,
    })
  )}.signature`;
}
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.clearAllMocks();
  mocks.apiReachable = false;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin: 'http://localhost:3000', replace, reload },
  });
});
afterEach(async () => {
  cleanup();
  if (descriptor) Object.defineProperty(window, 'location', descriptor);
  for (const db of databases.splice(0)) {
    db.close();
    await Dexie.delete(db.name);
  }
  localStorage.clear();
});
async function mount(accountId: string | null, loginPage = false) {
  if (accountId) localStorage.setItem('access_token', token(accountId));
  const { AuthProvider, useAuth } = await import('./auth-context');
  const { inspectionDb } = await import('../../db/inspection-db');
  databases.push(inspectionDb);
  function Probe() {
    const auth = useAuth();
    return (
      <>
        <span data-testid="identity">
          {auth.status}:{auth.user?.userId}
        </span>
        <button onClick={auth.logout}>Logout</button>
      </>
    );
  }
  const { LoginPage } = await import('../../pages/login-page');
  render(
    <MemoryRouter
      initialEntries={['/login?redirect=%2Fassets%3Fview%3Dtree%23asset']}
    >
      <AuthProvider>
        <Probe />
        {loginPage ? <LoginPage /> : null}
      </AuthProvider>
    </MemoryRouter>
  );
  return inspectionDb;
}

describe('account lifecycle', () => {
  it('resumes the matching account offline and closes its document on logout', async () => {
    const db = await mount('account-A');
    expect(screen.getByTestId('identity')).toHaveTextContent(
      'authenticated:account-A'
    );
    await db.tenants.put({ id: 'private', name: 'A' });
    fireEvent.click(screen.getByText('Logout'));
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('identity')).toHaveTextContent('anonymous:');
    expect(db.isOpen()).toBe(false);
    expect(replace).toHaveBeenCalledWith('/login');
    const preserved = new Dexie(db.name);
    databases.push(preserved);
    await preserved.open();
    expect(await preserved.table('tenants').get('private')).toMatchObject({
      name: 'A',
    });
  });

  it('hides A and reloads when another tab logs into B', async () => {
    const db = await mount('account-A');
    await db.open();
    act(() => {
      localStorage.setItem('access_token', token('account-B'));
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'access_token' })
      );
    });
    expect(screen.getByTestId('identity')).toHaveTextContent('checking:');
    expect(screen.getByTestId('identity')).not.toHaveTextContent('account-A');
    expect(db.isOpen()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not erase B when a delayed A profile rejects with 401', async () => {
    mocks.apiReachable = true;
    let reject!: (error: unknown) => void;
    mocks.profile.mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        })
    );
    await mount('account-A');
    await act(async () => {
      localStorage.setItem('access_token', token('account-B'));
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'access_token' })
      );
      reject({ status: 401 });
    });
    expect(localStorage.getItem('access_token')).toBe(token('account-B'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('starts a new document after login before exposing authenticated providers', async () => {
    mocks.apiReachable = true;
    mocks.login.mockResolvedValue({
      accessToken: token('account-B'),
      user: {
        userId: 'account-B',
        email: 'b@example.com',
        name: 'B',
        roles: ['user'],
      },
    });
    const db = await mount(null, true);
    await db.open();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'b@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password' },
    });
    const form = screen
      .getByRole('button', { name: 'Iniciar sesión' })
      .closest('form');
    if (!form) throw new Error('Expected the login form');
    fireEvent.submit(form);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/assets?view=tree#asset')
    );
    expect(localStorage.getItem('access_token')).toBe(token('account-B'));
    expect(screen.getByTestId('identity')).not.toHaveTextContent(
      'authenticated'
    );
    expect(db.isOpen()).toBe(false);
  });
});
