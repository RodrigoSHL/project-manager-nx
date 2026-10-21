import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MacrofitApiModule } from './macrofit-api.module';

describe('MacroFit BFF HTTP contract', () => {
  let app: INestApplication;
  let origin: string;
  let upstream: jest.SpyInstance;
  const httpFetch = globalThis.fetch;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [MacrofitApiModule],
    }).compile();
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
    return httpFetch(`${origin}${path}`, { method: 'POST', body });
  };
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
