'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Info,
  Landmark,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { convertCurrency, getCurrencies } from '@/services/currencyService';
import type {
  CurrencyConversion,
  CurrencyOption,
} from '@/services/currencyService';
import {
  currencyName,
  FALLBACK_CURRENCIES,
  formatCurrencyAmount,
  formatRate,
  mergeCurrencies,
} from './currency-ui';

function CurrencySelect({
  currencies,
  value,
  onChange,
  label,
}: {
  currencies: CurrencyOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-28 min-w-0 max-w-28 shrink-0 cursor-pointer rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
      aria-label={label}
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} · {currencyName(currency.code)}
        </option>
      ))}
    </select>
  );
}

export function QuickCurrencyConverter({
  onExpand,
}: {
  onExpand?: () => void;
}) {
  const [amount, setAmount] = useState('100000');
  const [from, setFrom] = useState('CLP');
  const [to, setTo] = useState('EUR');
  const [currencies, setCurrencies] =
    useState<CurrencyOption[]>(FALLBACK_CURRENCIES);
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const numericAmount = Number(amount.replace(',', '.'));
  const amountIsValid = Number.isFinite(numericAmount) && numericAmount > 0;

  useEffect(() => {
    const controller = new AbortController();
    getCurrencies(controller.signal)
      .then((available) => {
        setCurrencies(mergeCurrencies(available));
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof Error &&
          requestError.name !== 'AbortError'
        ) {
          // The essential travel currencies remain available as a fallback.
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!amountIsValid) {
      setConversion(null);
      setError(amount ? 'Ingresa un monto mayor que cero.' : null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      convertCurrency({ amount: numericAmount, from, to }, controller.signal)
        .then(setConversion)
        .catch((requestError: unknown) => {
          if (
            requestError instanceof Error &&
            requestError.name !== 'AbortError'
          ) {
            setError(requestError.message);
            setConversion(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [amount, amountIsValid, from, numericAmount, refreshKey, to]);

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
    if (conversion) setAmount(String(conversion.convertedAmount));
  }

  return (
    <section
      aria-labelledby="quick-currency-title"
      className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm"
    >
      <div className="grid lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,2fr)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full border-[28px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-12 left-10 size-28 rounded-full bg-emerald-200/20 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Landmark className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              Cambio rápido
            </p>
            <h2
              id="quick-currency-title"
              className="mt-1 text-xl font-bold tracking-tight"
            >
              ¿Cuánto recibirás?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-white/80">
              Convierte antes de pagar y viaja con una referencia clara.
            </p>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)]">
            <div className="min-w-0">
              <label
                htmlFor="currency-amount"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Tienes
              </label>
              <div className="flex gap-2">
                <input
                  id="currency-amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  className="h-11 w-0 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-lg font-bold tabular-nums outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15"
                  aria-invalid={!amountIsValid}
                  placeholder="0"
                />
                <CurrencySelect
                  currencies={currencies}
                  value={from}
                  onChange={setFrom}
                  label="Divisa de origen"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={swapCurrencies}
              className="mx-auto flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
              aria-label={`Invertir divisas: ${from} a ${to}`}
              title="Invertir divisas"
            >
              <ArrowRightLeft className="size-4" />
            </button>

            <div className="min-w-0">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Recibes aproximadamente
              </span>
              <div className="flex min-h-11 items-center gap-2">
                <div
                  className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-primary/15 bg-primary/[0.06] px-3 text-lg font-bold tabular-nums text-primary"
                  aria-live="polite"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : conversion ? (
                    <span className="truncate">
                      {formatCurrencyAmount(conversion.convertedAmount, to)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                <CurrencySelect
                  currencies={currencies}
                  value={to}
                  onChange={setTo}
                  label="Divisa de destino"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              {error ? (
                <p
                  className="text-sm font-medium text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : conversion ? (
                <p className="truncate text-sm text-muted-foreground">
                  1 {conversion.from} = {formatRate(conversion.rate)}{' '}
                  {conversion.to}
                  <span className="mx-2 text-border">•</span>
                  Tasa del{' '}
                  {new Intl.DateTimeFormat('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(`${conversion.date}T00:00:00Z`))}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Escribe un monto para calcular.
                </p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                <Info className="size-3 shrink-0" />
                Tasa referencial de bancos centrales; no incluye comisiones.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading || !amountIsValid}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                Actualizar
              </button>
              {onExpand && (
                <button
                  type="button"
                  onClick={onExpand}
                  className="flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-3 text-xs font-bold text-white shadow-sm shadow-cyan-950/15 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Más divisas
                  <ArrowRightLeft className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
