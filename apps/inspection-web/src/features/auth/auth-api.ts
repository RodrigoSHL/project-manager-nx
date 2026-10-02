import type { AuthSession, CurrentUser } from './models';

export class AuthApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await request<{
      access_token?: string;
      user?: CurrentUser;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!response.access_token || !response.user) {
      throw new AuthApiError('El servidor no entregó una sesión válida.');
    }
    return { accessToken: response.access_token, user: response.user };
  },

  profile(accessToken: string) {
    return request<CurrentUser>('/api/auth/profile', { accessToken });
  },
};

type AuthRequestInit = RequestInit & { accessToken?: string };

async function request<T>(path: string, init: AuthRequestInit = {}) {
  const { accessToken, ...requestInit } = init;
  let response: Response;
  try {
    response = await fetch(path, {
      ...requestInit,
      credentials: 'include',
      headers: {
        ...(requestInit.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...requestInit.headers,
      },
    });
  } catch {
    throw new AuthApiError('No fue posible conectar con el servidor.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const serverMessage = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;
    throw new AuthApiError(
      response.status === 401
        ? 'Correo o contraseña incorrectos.'
        : serverMessage || 'No fue posible validar la sesión.',
      response.status
    );
  }

  return response.json() as Promise<T>;
}
