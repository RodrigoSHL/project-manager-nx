import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { AuthModule } from '../auth/auth.module';
import { UserApiClient } from '../user-api/user-api.client';
import { MacrofitApiModule } from './macrofit-api.module';

describe('MacroFit BFF HTTP contract', () => {
  let app: INestApplication;
  let origin: string;
  let upstream: jest.SpyInstance;
  const httpFetch = globalThis.fetch;
  const token = sign(
    {
      sub: 'macrofit-test-user',
      email: 'test@example.invalid',
      name: 'Test',
      roles: ['user'],
    },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '5m' }
  );
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, MacrofitApiModule],
    })
      .overrideProvider(UserApiClient)
      .useValue({
        validateCredentials: async (email: string, password: string) => {
          if (email !== 'login@example.invalid' || password !== 'test-only')
            throw new UnauthorizedException();
          return {
            id: 'login-user',
            email,
            name: 'Login Test',
            roles: ['user'],
          };
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
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
  const describeMeal = (body: unknown) =>
    httpFetch(`${origin}/api/macrofit/analyze-meal-text`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  it('uses the common login JWT for profile and MacroFit analysis', async () => {
    const login = await httpFetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'login@example.invalid',
        password: 'test-only',
      }),
    });
    expect(login.status).toBe(200);
    const session = await login.json();
    const profile = await httpFetch(`${origin}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    expect(profile.status).toBe(200);
    expect((await profile.json()).userId).toBe('login-user');
    upstream.mockResolvedValue(
      new Response('{"items":["authenticated-result"]}', { status: 200 })
    );
    const analysis = await httpFetch(
      `${origin}/api/macrofit/analyze-meal-text`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: '{"text":"200 g de arroz"}',
      }
    );
    expect(analysis.status).toBe(200);
  });
  it('forwards an authenticated web product search and preserves provider errors', async () => {
    upstream.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          products: [],
          message: 'Sin resultados',
          searchSuggestions: null,
        }),
        { status: 200 }
      )
    );
    const call = (body: unknown) =>
      httpFetch(`${origin}/api/macrofit/products/search-web`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    const response = await call({ query: ' Mostaza Heinz ' });
    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/products/search-web'),
      expect.objectContaining({
        method: 'POST',
        body: '{"query":"Mostaza Heinz"}',
      })
    );
    upstream.mockClear();
    for (const body of [
      { query: 'x' },
      { query: 3 },
      { query: 'mostaza', source: 'invented' },
    ])
      expect((await call(body)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValueOnce(
      new Response('{"message":"Cuota agotada"}', { status: 503 })
    );
    const failure = await call({ query: 'Mostaza' });
    expect(failure.status).toBe(503);
    expect((await failure.json()).message).toBe('Cuota agotada');
  });
  it('rejects incorrect platform credentials', async () => {
    const response = await httpFetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":"login@example.invalid","password":"wrong"}',
    });
    expect(response.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each([
    '/api/macrofit/analyze-meal-text',
    '/api/macrofit/analyze-plate',
    '/api/macrofit/analyze-product-label',
    '/api/macrofit/products/search-web',
    '/api/analyze-plate',
  ])(
    'rejects missing, invalid and expired sessions at %s before calling the provider',
    async (path) => {
      const expired = sign(
        { sub: 'test', roles: ['user'] },
        process.env.JWT_SECRET || 'dev-secret-change-me',
        { expiresIn: -1 }
      );
      for (const credential of [null, 'invalid', expired]) {
        const response = await httpFetch(`${origin}${path}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
          },
          body: JSON.stringify({ text: '200 g de arroz' }),
        });
        expect(response.status).toBe(401);
      }
      expect(upstream).not.toHaveBeenCalled();
    }
  );
  it('forwards a validated description as JSON to the internal API', async () => {
    upstream.mockResolvedValue(
      new Response('{"items":["text-result"]}', { status: 200 })
    );
    const response = await describeMeal({
      text: '  9 g de mayonesa  ',
      mealType: 'lunch',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: ['text-result'] });
    const [url, init] = upstream.mock.calls[0];
    expect(url).toMatch(/\/api\/analyze-meal-text$/);
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({
      text: '9 g de mayonesa',
      mealType: 'lunch',
    });
  });
  it.each([
    {},
    { text: '   ' },
    { text: 'a'.repeat(2001) },
    { text: 200 },
    { text: '200 g de arroz', extra: true },
    { text: '200 g de arroz', mealType: 'invalid' },
  ])('rejects invalid text before forwarding: %j', async (body) => {
    expect((await describeMeal(body)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each([400, 429, 502, 503, 504])(
    'preserves HTTP %s for text analysis failures',
    async (status) => {
      upstream.mockResolvedValue(
        new Response('{"message":"Error controlado"}', { status })
      );
      const response = await describeMeal({ text: '200 g de arroz' });
      expect(response.status).toBe(status);
      expect((await response.json()).message).toBe('Error controlado');
    }
  );
  const upload = (
    path: string,
    field?: [string, string],
    mime = 'image/jpeg',
    size = 4
  ) => {
    const body = new FormData();
    body.append(
      'image',
      new Blob([new Uint8Array(size)], { type: mime }),
      'plate.jpg'
    );
    if (field) body.append(...field);
    return httpFetch(`${origin}${path}`, {
      method: 'POST',
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
  };
  it('protects catalog searches with JWT and validates the query before forwarding', async () => {
    expect(
      (await httpFetch(`${origin}/api/macrofit/products/search?q=yogur`)).status
    ).toBe(401);
    expect(
      (
        await httpFetch(`${origin}/api/macrofit/products/search?q=x`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{"products":[]}'));
    const result = await httpFetch(
      `${origin}/api/macrofit/products/search?q=Kraft%20%26%20mayo`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(result.status).toBe(200);
    expect(upstream.mock.calls[0][0]).toMatch(
      /\/api\/products\/search\?q=Kraft%20%26%20mayo$/
    );
  });
  it('forwards the preview opt-in while keeping the original search URL unchanged for installed clients', async () => {
    upstream.mockResolvedValue(new Response('{"products":[]}'));
    const result = await httpFetch(
      `${origin}/api/macrofit/products/search?q=Mayonesa&view=preview`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(result.status).toBe(200);
    expect(upstream.mock.calls[0][0]).toMatch(
      /\/api\/products\/search\?q=Mayonesa&view=preview$/
    );
  });
  it.each(['full', 'preview&view=preview'])(
    'rejects an invalid search view %s before forwarding',
    async (view) => {
      const result = await httpFetch(
        `${origin}/api/macrofit/products/search?q=Mayonesa&view=${view}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(result.status).toBe(400);
      expect(upstream).not.toHaveBeenCalled();
    }
  );
  it('forwards a label only to the label transcriber and preserves its real errors', async () => {
    upstream.mockResolvedValueOnce(new Response('{"name":"Etiqueta"}'));
    expect((await upload('/api/macrofit/analyze-product-label')).status).toBe(
      200
    );
    expect(upstream.mock.calls[0][0]).toMatch(/\/api\/analyze-product-label$/);
    expect(upstream.mock.calls[0][1].body.get('image').type).toBe('image/jpeg');
    expect(
      (
        await upload(
          '/api/macrofit/analyze-product-label',
          undefined,
          'text/plain'
        )
      ).status
    ).toBe(415);
    upstream.mockResolvedValueOnce(
      new Response('{"message":"Etiqueta ilegible"}', { status: 400 })
    );
    const response = await upload('/api/macrofit/analyze-product-label');
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe('Etiqueta ilegible');
  });
  it.each(['/api/macrofit/analyze-plate', '/api/analyze-plate'])(
    'forwards multipart through %s, including legacy PWA clients',
    async (path) => {
      upstream.mockResolvedValue(
        new Response(JSON.stringify({ items: ['provider-result'] }), {
          status: 200,
        })
      );
      const response = await upload(path, ['hints', 'sin sal']);
      expect(response.status).toBe(200);
      const [url, init] = upstream.mock.calls[0];
      expect(url).toMatch(/\/api\/analyze-plate$/);
      expect(init.body.get('hints')).toBe('sin sal');
      expect(init.body.get('image').type).toBe('image/jpeg');
      expect((await init.body.get('image').arrayBuffer()).byteLength).toBe(4);
    }
  );
  it.each([429, 502, 503, 504])(
    'preserves upstream HTTP %s and its message',
    async (status) => {
      upstream.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Error controlado' }), {
          status,
        })
      );
      const response = await upload('/api/macrofit/analyze-plate');
      expect(response.status).toBe(status);
      expect((await response.json()).message).toBe('Error controlado');
    }
  );
  it('returns 503 for unreachable upstream without exposing its error', async () => {
    upstream.mockRejectedValue(new Error('private upstream credentials'));
    const response = await upload('/api/macrofit/analyze-plate');
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('preserves a gateway timeout even when the upstream response is HTML', async () => {
    upstream.mockResolvedValue(
      new Response('<html>Gateway timeout</html>', { status: 504 })
    );
    const response = await upload('/api/macrofit/analyze-plate');
    expect(response.status).toBe(504);
    const body = await response.json();
    expect(body.message).toBe(
      'No fue posible completar la solicitud de MacroFit.'
    );
    expect(body.message).not.toContain('<html>');
  });
  it('returns 504 when the upstream body times out', async () => {
    const upstreamResponse = new Response('{}', { status: 200 });
    jest
      .spyOn(upstreamResponse, 'json')
      .mockRejectedValue(
        Object.assign(new Error('Aborted'), { name: 'AbortError' })
      );
    upstream.mockResolvedValue(upstreamResponse);
    expect((await upload('/api/macrofit/analyze-plate')).status).toBe(504);
  });
  it('rejects invalid metadata, media and oversized uploads before forwarding', async () => {
    expect(
      (await upload('/api/macrofit/analyze-plate', ['extra', 'value'])).status
    ).toBe(400);
    expect(
      (
        await upload('/api/macrofit/analyze-plate', [
          'plateTypeHint',
          'invalid',
        ])
      ).status
    ).toBe(400);
    expect(
      (await upload('/api/macrofit/analyze-plate', undefined, 'text/plain'))
        .status
    ).toBe(415);
    expect(
      (
        await upload(
          '/api/macrofit/analyze-plate',
          undefined,
          'image/jpeg',
          5 * 1024 * 1024 + 1
        )
      ).status
    ).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('exposes distinct health and readiness routes', async () => {
    upstream
      .mockResolvedValueOnce(new Response('{"status":"ok"}', { status: 200 }))
      .mockResolvedValueOnce(
        new Response('{"message":"Sin configurar"}', { status: 503 })
      );
    expect((await httpFetch(`${origin}/api/macrofit/health`)).status).toBe(200);
    expect((await httpFetch(`${origin}/api/macrofit/ready`)).status).toBe(503);
  });
});
