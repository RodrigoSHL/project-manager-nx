import { getAuthHeaders } from '@/lib/auth';

const API_BASE_URL = '/api/currency';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string | null;
}

export interface CurrencyConversion {
  amount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  date: string;
  source: string;
}

export interface MultiCurrencyConversion {
  amount: number;
  from: string;
  conversions: Array<{
    to: string;
    convertedAmount: number;
    rate: number;
    date: string;
  }>;
  source: string;
}

export interface CurrencyPreferences {
  baseCurrency: string;
  targetCurrencies: string[];
  feePercent: number;
  quickAmounts: number[];
  updatedAt: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;

    if (response.status === 401) {
      throw new Error('Inicia sesión nuevamente para consultar tus divisas.');
    }
    if (response.status === 404 || message?.startsWith('Cannot ')) {
      throw new Error(
        'El conversor se está actualizando. Intenta nuevamente en un momento.'
      );
    }
    if (response.status >= 500) {
      throw new Error(
        'El servicio de cambio no está disponible por el momento.'
      );
    }

    throw new Error(
      message || 'No pudimos obtener el cambio. Inténtalo nuevamente.'
    );
  }
  return response.json() as Promise<T>;
}

export async function getCurrencies(
  signal?: AbortSignal
): Promise<CurrencyOption[]> {
  const response = await fetch(`${API_BASE_URL}/currencies`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
    signal,
  });
  return handleResponse<CurrencyOption[]>(response);
}

export async function convertCurrency(
  input: { amount: number; from: string; to: string },
  signal?: AbortSignal
): Promise<CurrencyConversion> {
  const query = new URLSearchParams({
    amount: String(input.amount),
    from: input.from,
    to: input.to,
  });
  const response = await fetch(`${API_BASE_URL}/convert?${query}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
    signal,
  });
  return handleResponse<CurrencyConversion>(response);
}

export async function convertMultipleCurrencies(
  input: { amount: number; from: string; to: string[] },
  signal?: AbortSignal
): Promise<MultiCurrencyConversion> {
  const query = new URLSearchParams({
    amount: String(input.amount),
    from: input.from,
    to: input.to.join(','),
  });
  const response = await fetch(`${API_BASE_URL}/convert/multiple?${query}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
    signal,
  });
  return handleResponse<MultiCurrencyConversion>(response);
}

export async function getCurrencyPreferences(
  signal?: AbortSignal
): Promise<CurrencyPreferences> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    cache: 'no-store',
    credentials: 'include',
    headers: getAuthHeaders(),
    signal,
  });
  return handleResponse<CurrencyPreferences>(response);
}

export async function saveCurrencyPreferences(
  preferences: Omit<CurrencyPreferences, 'updatedAt'>
): Promise<CurrencyPreferences> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(preferences),
  });
  return handleResponse<CurrencyPreferences>(response);
}
