import type { CurrencyOption } from '@/services/currencyService';

export const FALLBACK_CURRENCIES: CurrencyOption[] = [
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
];

const PRIORITY_CODES = FALLBACK_CURRENCIES.map(({ code }) => code);
const displayNames = new Intl.DisplayNames(['es'], { type: 'currency' });

export function mergeCurrencies(
  currencies: CurrencyOption[]
): CurrencyOption[] {
  const unique = new Map(
    [...FALLBACK_CURRENCIES, ...currencies].map((currency) => [
      currency.code,
      currency,
    ])
  );
  return [...unique.values()].sort((left, right) => {
    const leftPriority = PRIORITY_CODES.indexOf(left.code);
    const rightPriority = PRIORITY_CODES.indexOf(right.code);
    if (leftPriority >= 0 || rightPriority >= 0) {
      if (leftPriority < 0) return 1;
      if (rightPriority < 0) return -1;
      return leftPriority - rightPriority;
    }
    return left.code.localeCompare(right.code);
  });
}

export function currencyName(code: string): string {
  return displayNames.of(code) ?? code;
}

export function formatCurrencyAmount(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(value);
}

export function formatRate(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumSignificantDigits: 6,
  }).format(value);
}
