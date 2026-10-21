import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import sharp from 'sharp';
import { configureApp } from '../configure-app';
import { PlateAnalysisController } from './plate-analysis.controller';
import { PlateAnalysisService } from './plate-analysis.service';

describe('PlateAnalysis HTTP validation', () => {
  let app: INestApplication;
  let origin: string;
  let image: Buffer;
  const service = {
    analyzePlate: jest.fn().mockResolvedValue({ dish_name: 'provider-result' }),
    readiness: jest.fn().mockReturnValue({ status: 'ready' }),
  };
  const environment = { ...process.env };
  beforeAll(async () => {
    process.env.API_PREFIX = 'audit';
    process.env.CORS_ORIGIN = 'https://allowed.example';
    const module = await Test.createTestingModule({
      controllers: [PlateAnalysisController],
      providers: [{ provide: PlateAnalysisService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
    image = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#ff0000' },
    })
      .png()
      .toBuffer();
  });
  afterAll(async () => {
    await app?.close();
    process.env = { ...environment };
  });
  beforeEach(() => service.analyzePlate.mockClear());
  function form(bytes: Uint8Array = new Uint8Array(image), mime = 'image/png') {
    const body = new FormData();
    body.append('image', new Blob([bytes], { type: mime }), 'plate');
    return body;
  }
  const send = (body: FormData) =>
    fetch(`${origin}/audit/analyze-plate`, { method: 'POST', body });
  it('fully decodes valid images and forwards normalized JPEG pixels', async () => {
    const body = form();
    body.append('hints', 'sin sal');
    body.append('plateTypeHint', 'bowl');
    const response = await send(body);
    expect(response.status).toBe(200);
    const [pixels, mime] = service.analyzePlate.mock.calls[0];
    expect(mime).toBe('image/jpeg');
    expect((await sharp(pixels).metadata()).format).toBe('jpeg');
  });
  it('rejects text even when its declared MIME claims an image', async () => {
    expect(
      (await send(form(new Uint8Array(Buffer.from('not an image'))))).status
    ).toBe(400);
    expect((await send(form(new Uint8Array(image), 'text/plain'))).status).toBe(
      415
    );
    expect(service.analyzePlate).not.toHaveBeenCalled();
  });
  it('rejects files above 5 MB', async () => {
    expect((await send(form(new Uint8Array(5 * 1024 * 1024 + 1)))).status).toBe(
      413
    );
    expect(service.analyzePlate).not.toHaveBeenCalled();
  });
  it.each([
    ['plateTypeHint', 'invalid'],
    ['hints', 'a'.repeat(501)],
    ['extra', 'ignored-before'],
  ])('rejects invalid field %s', async (key, value) => {
    const body = form();
    body.append(key, value);
    expect((await send(body)).status).toBe(400);
    expect(service.analyzePlate).not.toHaveBeenCalled();
  });
  it('rejects JSON/base64 instead of promising a different image contract', async () => {
    const response = await fetch(`${origin}/audit/analyze-plate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: 'aGVsbG8=', hints: {} }),
    });
    expect(response.status).toBe(400);
    expect(service.analyzePlate).not.toHaveBeenCalled();
  });
  it('respects the configured prefix and exact CORS allowlist', async () => {
    expect((await fetch(`${origin}/api/ready`)).status).toBe(404);
    const allowed = await fetch(`${origin}/audit/ready`, {
      headers: { Origin: 'https://allowed.example' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'https://allowed.example'
    );
    for (const originHeader of [
      'http://localhost:4205',
      'https://other.atomdev.cl',
    ]) {
      const response = await fetch(`${origin}/audit/ready`, {
        headers: { Origin: originHeader },
      });
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    }
  });
});
