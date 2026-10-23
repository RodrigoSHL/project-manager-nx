import { MealType, PlateAnalysisResponse } from '../types/nutrition';
import {
  authenticatedFetch,
  getAccessToken,
  SessionChangedError,
} from '../features/auth/auth-session';

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

  return requestAnalysis('/api/macrofit/analyze-plate', { body: formData });
}

export async function analyzeMealText(
  text: string,
  mealType?: MealType,
  signal?: AbortSignal
): Promise<PlateAnalysisResponse> {
  const description = text.trim();
  if (description.length < 5 || description.length > 2000) {
    throw new Error('Describe tu comida usando entre 5 y 2000 caracteres.');
  }
  return requestAnalysis(
    '/api/macrofit/analyze-meal-text',
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: description,
        ...(mealType ? { mealType } : {}),
      }),
    },
    signal
  );
}

async function requestAnalysis(
  path: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<PlateAnalysisResponse> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const token = getAccessToken();
    const response = await authenticatedFetch(path, {
      method: 'POST',
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const fallbackMessages: Record<number, string> = {
        401: 'Tu sesión expiró. Inicia sesión nuevamente.',
        403: 'Tu cuenta no tiene permiso para realizar este análisis.',
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

    const result = await response.json();
    if (token !== getAccessToken()) throw new SessionChangedError();
    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'El análisis tardó demasiado tiempo en responder. Por favor intenta nuevamente.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', cancel);
  }
}
