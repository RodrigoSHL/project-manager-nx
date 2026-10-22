import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzePlateImage } from './plateAnalysisApi';

afterEach(() => vi.unstubAllGlobals());
const image = () => new Blob(['jpeg'], { type: 'image/jpeg' });

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
