const CURRENCY_DIGITS: Record<string, number> = { CLP: 0, JPY: 0, KRW: 0, BHD: 3, KWD: 3 };

export function currencyDigits(currency: string): number { return CURRENCY_DIGITS[currency.toUpperCase()] ?? 2; }

export function decimalToMinor(value: string | number, currency: string): bigint {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error('Invalid monetary amount');
  const digits = currencyDigits(currency);
  const [whole, fraction = ''] = normalized.split('.');
  const rounded = (fraction + '0'.repeat(digits + 1)).slice(0, digits + 1);
  let result = BigInt(whole) * 10n ** BigInt(digits) + BigInt(rounded.slice(0, digits) || '0');
  if (Number(rounded[digits] ?? '0') >= 5) result += 1n;
  return result;
}

export function minorToDecimal(value: bigint | string, currency: string): string {
  const minor = BigInt(value); const digits = currencyDigits(currency);
  if (!digits) return minor.toString();
  const padded = minor.toString().padStart(digits + 1, '0');
  return `${padded.slice(0, -digits)}.${padded.slice(-digits)}`;
}

export function convertMinor(amount: bigint, rate: string, fromCurrency: string, toCurrency: string): bigint {
  const match = rate.trim().match(/^(\d+)(?:\.(\d+))?$/); if (!match) throw new Error('Invalid exchange rate');
  const scale = (match[2] ?? '').length;
  const numerator = BigInt(match[1] + (match[2] ?? '')) * 10n ** BigInt(currencyDigits(toCurrency));
  const denominator = 10n ** BigInt(scale + currencyDigits(fromCurrency));
  return (amount * numerator + denominator / 2n) / denominator;
}

export function allocateEqual(total: bigint, count: number): bigint[] {
  if (count < 1) throw new Error('At least one participant is required');
  const base = total / BigInt(count); const remainder = total % BigInt(count);
  return Array.from({ length: count }, (_, i) => base + (BigInt(i) < remainder ? 1n : 0n));
}

export function optimizeDebts(netValues: Record<string, bigint>): Array<{ fromUserId: string; toUserId: string; amountMinor: bigint }> {
  const creditors = Object.entries(netValues).filter(([, value]) => value > 0n).map(([id, amount]) => ({ id, amount }));
  const debtors = Object.entries(netValues).filter(([, value]) => value < 0n).map(([id, amount]) => ({ id, amount: -amount }));
  const result: Array<{ fromUserId: string; toUserId: string; amountMinor: bigint }> = [];
  let debtor = 0, creditor = 0;
  while (debtor < debtors.length && creditor < creditors.length) {
    const amount = debtors[debtor].amount < creditors[creditor].amount ? debtors[debtor].amount : creditors[creditor].amount;
    result.push({ fromUserId: debtors[debtor].id, toUserId: creditors[creditor].id, amountMinor: amount });
    debtors[debtor].amount -= amount; creditors[creditor].amount -= amount;
    if (debtors[debtor].amount === 0n) debtor++; if (creditors[creditor].amount === 0n) creditor++;
  }
  return result;
}
