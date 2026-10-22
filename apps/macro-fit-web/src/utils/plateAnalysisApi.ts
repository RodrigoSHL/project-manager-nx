import { PlateAnalysisResponse } from '../types/nutrition';

export interface AnalyzePlateOptions {
  hints?: string;
  plateTypeHint?: 'plato_extendido' | 'plato_hondo' | 'bowl';
}

export async function analyzePlateImage(
  imageBlobOrFile: Blob | File,
  options?: AnalyzePlateOptions
): Promise<PlateAnalysisResponse> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(imageBlobOrFile.type)
  ) {
    throw new Error('Usa una imagen JPEG, PNG o WebP.');
  }
  if (!imageBlobOrFile.size || imageBlobOrFile.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede estar vacía ni superar 5 MB.');
  }
  const formData = new FormData();
  formData.append('image', imageBlobOrFile, 'plate.jpg');
  if (options?.hints) {
    formData.append('hints', options.hints);
  }
  if (options?.plateTypeHint) {
    formData.append('plateTypeHint', options.plateTypeHint);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('/api/macrofit/analyze-plate', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const fallbackMessages: Record<number, string> = {
        429: 'Hay demasiados análisis en curso. Intenta nuevamente en un minuto.',
        502: 'El servicio de análisis devolvió una respuesta inválida. Intenta nuevamente.',
        503: 'Gemini no está disponible temporalmente. Intenta nuevamente en unos momentos.',
        504: 'El análisis tardó demasiado en responder. Intenta nuevamente.',
      };
      throw new Error(
        (Array.isArray(errorData?.message)
          ? errorData.message.join('. ')
          : errorData?.message) ||
          fallbackMessages[response.status] ||
          `No fue posible analizar el plato (HTTP ${response.status}).`
      );
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'El análisis tardó demasiado tiempo en responder. Por favor intenta nuevamente.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
