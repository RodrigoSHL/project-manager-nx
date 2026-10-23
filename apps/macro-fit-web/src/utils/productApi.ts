import {
  ProductDraft,
  productDraftSchema,
  productSearchSchema,
} from '../types/nutrition';
import {
  authenticatedFetch,
  getAccessToken,
  SessionChangedError,
} from '../features/auth/auth-session';

async function request(path: string, init: RequestInit, signal: AbortSignal) {
  const token = getAccessToken();
  try {
    const response = await authenticatedFetch(`/api/macrofit/${path}`, {
      ...init,
      signal,
    });
    const data = await response.json().catch(() => null);
    if (token !== getAccessToken()) throw new SessionChangedError();
    if (!response.ok)
      throw new Error(
        typeof data?.message === 'string'
          ? data.message
          : `No se pudo completar la solicitud (HTTP ${response.status}). Puedes ingresar los datos manualmente.`
      );
    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      ['AbortError', 'TimeoutError'].includes(error.name)
    )
      throw new Error(
        'La solicitud tardó demasiado o fue cancelada. Puedes ingresar los datos manualmente.'
      );
    throw error;
  }
}
export async function searchProducts(
  query: string,
  signal: AbortSignal
): Promise<ProductDraft[]> {
  const data = await request(
    `products/search?q=${encodeURIComponent(query.trim())}`,
    { cache: 'no-store' },
    signal
  );
  const result = productSearchSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      'La búsqueda entregó datos inválidos. Ingresa el producto manualmente.'
    );
  return result.data.products;
}
export async function readProductLabel(
  file: File,
  signal: AbortSignal
): Promise<ProductDraft> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    !file.size ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error('Usa una imagen JPEG, PNG o WebP de hasta 5 MB.');
  const form = new FormData();
  form.append('image', file, 'label');
  const data = await request(
    'analyze-product-label',
    { method: 'POST', body: form },
    signal
  );
  const result = productDraftSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      'La lectura entregó datos inválidos. Ingresa el producto manualmente.'
    );
  return result.data;
}
