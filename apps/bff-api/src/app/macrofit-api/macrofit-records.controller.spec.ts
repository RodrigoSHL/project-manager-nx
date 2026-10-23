import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { AuthModule } from '../auth/auth.module';
import { UserApiClient } from '../user-api/user-api.client';
import { MacrofitApiModule } from './macrofit-api.module';

describe('MacroFit personal records BFF', () => {
  let app: INestApplication;
  let origin: string;
  let upstream: jest.SpyInstance;
  const httpFetch = globalThis.fetch;
  const userId = '00000000-0000-4000-8000-000000000001';
  const token = sign(
    { sub: userId, email: 'records@example.invalid', roles: ['user'] },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '5m' }
  );
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, MacrofitApiModule],
    })
      .overrideProvider(UserApiClient)
      .useValue({})
      .compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  beforeEach(() => {
    upstream = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => upstream.mockRestore());
  afterAll(async () => {
    await app?.close();
  });
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  it.each(['/api/macrofit/me', '/api/macrofit/me/days/2026-10-23'])(
    'rejects anonymous and invalid sessions: %s',
    async (path) => {
      expect((await httpFetch(origin + path)).status).toBe(401);
      expect(
        (
          await httpFetch(origin + path, {
            headers: { Authorization: 'Bearer invalid' },
          })
        ).status
      ).toBe(401);
      expect(upstream).not.toHaveBeenCalled();
    }
  );
  it('overwrites forged identity headers with the verified JWT identity', async () => {
    upstream.mockResolvedValue(
      new Response('{"profile":null}', { status: 200 })
    );
    const response = await httpFetch(`${origin}/api/macrofit/me`, {
      headers: { ...headers, 'x-user-id': 'another-user' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
  });
  it('rejects caller-supplied ownership and malformed day records before forwarding', async () => {
    const response = await httpFetch(
      `${origin}/api/macrofit/me/days/2026-10-23/water`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operationId: '00000000-0000-4000-8000-000000000002',
          amountMl: 250,
          userId: 'other',
        }),
      }
    );
    expect(response.status).toBe(400);
    expect(
      (
        await httpFetch(`${origin}/api/macrofit/me/days/2026-02-31`, {
          headers,
        })
      ).status
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('preserves storage errors so the browser cannot report a successful save', async () => {
    upstream.mockResolvedValue(
      new Response('{"message":"Base no disponible"}', { status: 503 })
    );
    const response = await httpFetch(`${origin}/api/macrofit/me`, { headers });
    expect(response.status).toBe(503);
    expect((await response.json()).message).toBe('Base no disponible');
  });
});
