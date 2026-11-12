import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { AuthModule } from '../auth/auth.module';
import { UserApiClient } from '../user-api/user-api.client';
import { MacrofitApiModule } from './macrofit-api.module';
import { createPautaTemplate } from '@project-manager/macrofit-contracts';

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
  it('protects dashboard history, bounds its range and replaces a forged owner with the JWT identity', async () => {
    const path = '/api/macrofit/me/dashboard';
    expect(
      (await httpFetch(origin + path + '?from=2026-10-01&to=2026-10-07')).status
    ).toBe(401);
    for (const query of [
      '?from=2026-02-30&to=2026-03-01',
      '?from=2026-10-07&to=2026-10-01',
      '?from=2026-01-01&to=2026-04-01',
      '?from=2026-10-01&to=2026-10-07&userId=foreign',
      '?from=2026-10-01',
    ])
      expect((await httpFetch(origin + path + query, { headers })).status).toBe(
        400
      );
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await httpFetch(
      origin + path + '?from=2026-10-01&to=2026-10-07',
      { headers: { ...headers, 'x-user-id': 'foreign' } }
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/me/dashboard?from=2026-10-01&to=2026-10-07'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
  });
  it('authenticates training writes and forwards a valid draft with the account identity', async () => {
    const path = '/api/macrofit/me/training/draft';
    const body = {
      revision: 0,
      draft: {
        id: '00000000-0000-4000-8000-000000000002',
        startedAt: '2026-11-12T12:00:00.000Z',
        exercises: [
          {
            exerciseId: 'leg-extension',
            sets: [
              {
                id: '00000000-0000-4000-8000-000000000003',
                reps: 10,
                weightKg: 35,
              },
            ],
          },
        ],
      },
    };
    const put = (value: unknown, requestHeaders: Record<string, string>) =>
      httpFetch(origin + path, {
        method: 'PUT',
        headers: requestHeaders,
        body: JSON.stringify(value),
      });
    expect(
      (await put(body, { 'Content-Type': 'application/json' })).status
    ).toBe(401);
    expect((await put({ ...body, userId: 'external' }, headers)).status).toBe(
      400
    );
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    expect(
      (await put(body, { ...headers, 'x-user-id': 'external' })).status
    ).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/me/training/draft'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'x-user-id': userId }),
        body: JSON.stringify(body),
      })
    );
  });
  it('authenticates and validates a meal equivalence without a product, using only the JWT owner upstream', async () => {
    const path = '/api/macrofit/me/days/2026-10-25/meals/meal/equivalence';
    const body = {
      expectedPlanVersion: 2,
      expectedDayPlanVersion: 1,
      expectedQuantity: { amount: 200, unit: 'g' },
      equivalence: {
        referenceAmount: 100,
        unit: 'g',
        free: false,
        contributions: [{ group: 'carbs', portions: 1 }],
        notes: 'Referencia sintética de prueba.',
      },
    };
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(401);
    for (const invalid of [
      { ...body, userId: 'forged' },
      { ...body, productId: 'foreign' },
      { ...body, expectedQuantity: { amount: 0, unit: 'g' } },
      { ...body, equivalence: { ...body.equivalence, contributions: [] } },
    ])
      expect(
        (
          await httpFetch(origin + path, {
            method: 'PUT',
            headers,
            body: JSON.stringify(invalid),
          })
        ).status
      ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { ...headers, 'x-user-id': 'forged' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/days/2026-10-25/meals/meal/equivalence'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(body);
  });
  it('authenticates and validates direct product suggestions and equivalence writes without a diary route', async () => {
    const base = '/api/macrofit/me/foods/own-product';
    const input = {
      expectedPlanVersion: 1,
      equivalence: {
        referenceAmount: 60,
        unit: 'g',
        contributions: [{ group: 'protein', portions: 1 }],
        free: false,
        notes: '',
      },
    };
    for (const [suffix, method, body] of [
      [
        '/equivalence-suggestions',
        'POST',
        { catalogPlanVersion: 1, useAi: false },
      ],
      ['/equivalence', 'PUT', input],
    ] as const) {
      expect(
        (
          await httpFetch(origin + base + suffix, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        ).status
      ).toBe(401);
      expect(
        (
          await httpFetch(origin + base + suffix, {
            method,
            headers,
            body: JSON.stringify({ ...body, userId: 'forged' }),
          })
        ).status
      ).toBe(400);
      expect(upstream).not.toHaveBeenCalled();
      upstream.mockResolvedValue(new Response('{}', { status: 200 }));
      expect(
        (
          await httpFetch(origin + base + suffix, {
            method,
            headers: { ...headers, 'x-user-id': 'forged' },
            body: JSON.stringify(body),
          })
        ).status
      ).toBe(200);
      expect(upstream).toHaveBeenLastCalledWith(
        expect.stringContaining('/foods/own-product' + suffix),
        expect.objectContaining({
          method,
          headers: expect.objectContaining({ 'x-user-id': userId }),
          body: JSON.stringify(body),
        })
      );
      upstream.mockClear();
    }
  });
  it('protects recommendation reads and forwards only validated input with the JWT owner', async () => {
    const path =
      '/api/macrofit/me/days/2026-10-23/meals/meal/equivalence-suggestions';
    const body = {
      productId: 'heinz',
      dayPlanVersion: 1,
      catalogPlanVersion: 2,
      useAi: false,
    };
    expect(
      (
        await httpFetch(origin + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(401);
    for (const invalid of [
      { ...body, userId: 'foreign' },
      { ...body, useAi: 'yes' },
      { ...body, dayPlanVersion: 0 },
    ])
      expect(
        (
          await httpFetch(origin + path, {
            method: 'POST',
            headers,
            body: JSON.stringify(invalid),
          })
        ).status
      ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await httpFetch(origin + path, {
      method: 'POST',
      headers: { ...headers, 'x-user-id': 'foreign' },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/meals/meal/equivalence-suggestions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-user-id': userId }),
        body: JSON.stringify(body),
      })
    );
    upstream.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Proveedor no disponible' }), {
        status: 503,
      })
    );
    expect(
      (
        await httpFetch(origin + path, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...body, useAi: true }),
        })
      ).status
    ).toBe(503);
  });
  it('forwards explicit new-proposal mode through both product and diary routes while rejecting an implicit AI request', async () => {
    for (const [path, version] of [
      [
        '/api/macrofit/me/foods/heinz/equivalence-suggestions',
        { catalogPlanVersion: 2 },
      ],
      [
        '/api/macrofit/me/days/2026-10-23/meals/meal/equivalence-suggestions',
        { catalogPlanVersion: 2, dayPlanVersion: 1, productId: 'heinz' },
      ],
    ] as const) {
      upstream.mockClear();
      const body = { ...version, useAi: true, mode: 'estimate' };
      expect(
        (
          await httpFetch(origin + path, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, useAi: false }),
          })
        ).status
      ).toBe(400);
      expect(upstream).not.toHaveBeenCalled();
      upstream.mockResolvedValue(new Response('{}', { status: 200 }));
      expect(
        (
          await httpFetch(origin + path, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          })
        ).status
      ).toBe(200);
      expect(upstream).toHaveBeenCalledWith(
        expect.stringContaining('/equivalence-suggestions'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-user-id': userId }),
          body: expect.any(String),
        })
      );
      expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(body);
    }
  });
  it('protects and validates the product equivalence write before forwarding the verified owner', async () => {
    const path =
      '/api/macrofit/me/days/2026-10-23/meals/meal/product-equivalence';
    const body = {
      productId: 'heinz',
      expectedPlanVersion: 2,
      expectedDayPlanVersion: 1,
      expectedQuantity: { amount: 30, unit: 'g' },
      equivalence: {
        referenceAmount: 15,
        unit: 'g',
        free: false,
        notes: '',
        contributions: [{ group: 'fats', portions: 0.25 }],
      },
    };
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
    for (const invalid of [
      { ...body, userId: 'foreign' },
      { ...body, expectedPlanVersion: 0 },
      { ...body, equivalence: { ...body.equivalence, contributions: [] } },
      { ...body, equivalence: { ...body.equivalence, free: true } },
    ]) {
      expect(
        (
          await httpFetch(origin + path, {
            method: 'PUT',
            headers,
            body: JSON.stringify(invalid),
          })
        ).status
      ).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { ...headers, 'x-user-id': 'foreign' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining(
        '/days/2026-10-23/meals/meal/product-equivalence'
      ),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(body);
  });
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
  it('requires authentication for plan writes and review of food equivalences', async () => {
    for (const path of ['/plan', '/days/2026-10-23/meals/entry/pauta']) {
      expect(
        (
          await httpFetch(origin + '/api/macrofit/me' + path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          })
        ).status
      ).toBe(401);
    }
    expect(upstream).not.toHaveBeenCalled();
  });
  it('validates plans and forwards food classification using only the verified owner', async () => {
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await httpFetch(
      origin + '/api/macrofit/me/days/2026-10-23/meals/entry/pauta',
      {
        method: 'PUT',
        headers: { ...headers, 'x-user-id': 'forged-owner' },
        body: JSON.stringify({ ruleId: 'chicken' }),
      }
    );
    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/me/days/2026-10-23/meals/entry/pauta'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ruleId: 'chicken' }),
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
    upstream.mockClear();
    const invalid = await httpFetch(origin + '/api/macrofit/me/plan', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'Plan', userId: 'forged' }),
    });
    expect(invalid.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('forwards explicit application to today and rejects an activated blank plan', async () => {
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    const plan = {
      name: 'Pauta',
      startsOn: '2026-10-23',
      enabled: true,
      targets: {
        protein: 10,
        carbs: null,
        fats: null,
        dairy: null,
        fruits: null,
        veggies: null,
        supplements: null,
      },
      waterTargetMl: 2000,
      waterIsMinimum: true,
      rules: [
        {
          id: 'chicken',
          name: 'Pollo cocido',
          foodIds: [],
          aliases: [],
          referenceAmount: 50,
          unit: 'g',
          free: false,
          notes: '',
          contributions: [{ group: 'protein', portions: 1 }],
        },
      ],
      applyToToday: true,
    };
    expect(
      (
        await httpFetch(origin + '/api/macrofit/me/plan', {
          method: 'PUT',
          headers,
          body: JSON.stringify(plan),
        })
      ).status
    ).toBe(200);
    expect(JSON.parse(upstream.mock.calls[0][1].body).applyToToday).toBe(true);
    upstream.mockClear();
    expect(
      (
        await httpFetch(origin + '/api/macrofit/me/plan', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...plan, rules: [] }),
        })
      ).status
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('forwards the complete exchange template and explicit cup classification through the authenticated BFF', async () => {
    upstream.mockImplementation(
      async () => new Response('{}', { status: 200 })
    );
    const input = createPautaTemplate('2026-10-24');
    const saved = await httpFetch(origin + '/api/macrofit/me/plan', {
      method: 'PUT',
      headers: { ...headers, 'x-user-id': 'forged' },
      body: JSON.stringify(input),
    });
    expect(saved.status).toBe(200);
    expect(upstream.mock.calls[0][1].headers['x-user-id']).toBe(userId);
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(input);
    expect(JSON.parse(upstream.mock.calls[0][1].body).rules).toHaveLength(133);
    upstream.mockClear();
    const selection = {
      ruleId: 'meds-arandanos',
      quantity: { amount: 0.5, unit: 'cup' },
    };
    const classified = await httpFetch(
      origin + '/api/macrofit/me/days/2026-10-24/meals/berries/pauta',
      { method: 'PUT', headers, body: JSON.stringify(selection) }
    );
    expect(classified.status).toBe(200);
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(selection);
  });
  it('preserves storage errors so the browser cannot report a successful save', async () => {
    upstream.mockResolvedValue(
      new Response('{"message":"Base no disponible"}', { status: 503 })
    );
    const response = await httpFetch(`${origin}/api/macrofit/me`, { headers });
    expect(response.status).toBe(503);
    expect((await response.json()).message).toBe('Base no disponible');
  });
  it('authenticates quantity edits and forwards only validated quantities under the JWT owner', async () => {
    const path = '/api/macrofit/me/days/2026-10-23/meals/entry/quantity';
    const body = {
      quantity: { amount: 120, unit: 'g' },
      expectedQuantity: { amount: 140, unit: 'g' },
    };
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    expect(
      (
        await httpFetch(origin + path, {
          method: 'PUT',
          headers: { ...headers, 'x-user-id': 'forged' },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      expect.stringContaining('/me/days/2026-10-23/meals/entry/quantity'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
        headers: expect.objectContaining({ 'x-user-id': userId }),
      })
    );
    upstream.mockClear();
    for (const invalid of [
      { ...body, userId: 'forged' },
      { ...body, calories: 1 },
      { quantity: body.quantity },
      { ...body, quantity: { amount: -1, unit: 'g' } },
      { ...body, quantity: { amount: 20001, unit: 'g' } },
      { ...body, quantity: { amount: 1, unit: 'kg' } },
    ]) {
      expect(
        (
          await httpFetch(origin + path, {
            method: 'PUT',
            headers,
            body: JSON.stringify(invalid),
          })
        ).status
      ).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValue(
      new Response('{"message":"La cantidad cambió"}', { status: 409 })
    );
    const conflict = await httpFetch(origin + path, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).message).toBe('La cantidad cambió');
  });
});
