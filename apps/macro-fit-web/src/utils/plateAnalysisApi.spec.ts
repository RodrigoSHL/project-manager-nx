import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeMealText, analyzePlateImage } from './plateAnalysisApi';

beforeEach(() =>
  localStorage.setItem(
    'access_token',
    'test.' +
      btoa(
        JSON.stringify({
          sub: 'test',
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ) +
      '.test'
  )
);
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});
const image = () => new Blob(['jpeg'], { type: 'image/jpeg' });

describe('text analysis request', () => {
  it('sends only the reviewed text and optional meal as JSON through BFF', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal('fetch', fetch);
    await analyzeMealText('  200 g de carne  ', 'lunch');
    const [path, init] = fetch.mock.calls[0];
    expect(path).toBe('/api/macrofit/analyze-meal-text');
    expect(JSON.parse(init.body)).toEqual({
      text: '200 g de carne',
      mealType: 'lunch',
    });
    expect(new Headers(init.headers).get('content-type')).toBe(
      'application/json'
    );
    expect(new Headers(init.headers).get('Authorization')).toMatch(/^Bearer /);
  });
  it.each(['   ', 'a'.repeat(2001)])(
    'does not send an invalid description',
    async (text) => {
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      await expect(analyzeMealText(text)).rejects.toThrow('2000');
      expect(fetch).not.toHaveBeenCalled();
    }
  );
  it('retains a useful error if text analysis receives an HTML gateway timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => {
          throw new SyntaxError();
        },
      })
    );
    await expect(analyzeMealText('200 g de carne')).rejects.toThrow(
      'tardó demasiado'
    );
  });
});

describe('plate analysis errors', () => {
  it.each([502, 503, 504, 429])(
    'shows the actual server error for HTTP %s',
    async (status) => {
      const fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ message: 'Gemini no disponible' }),
      });
      vi.stubGlobal('fetch', fetch);
      await expect(analyzePlateImage(image())).rejects.toThrow(
        'Gemini no disponible'
      );
      expect(fetch.mock.calls[0][0]).toBe('/api/macrofit/analyze-plate');
    }
  );
  it('does not upload an unsupported image', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      analyzePlateImage(new Blob(['text'], { type: 'text/plain' }))
    ).rejects.toThrow('JPEG');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('shows a useful timeout message when the gateway returns HTML instead of JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        statusText: '',
        json: async () => {
          throw new SyntaxError('HTML response');
        },
      })
    );
    await expect(analyzePlateImage(image())).rejects.toThrow(
      'El análisis tardó demasiado en responder. Intenta nuevamente.'
    );
  });
});
