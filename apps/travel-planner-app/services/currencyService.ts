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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;
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
