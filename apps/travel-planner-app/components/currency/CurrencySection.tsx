'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Check,
  CircleGauge,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  convertMultipleCurrencies,
  getCurrencies,
  getCurrencyPreferences,
  saveCurrencyPreferences,
} from '@/services/currencyService';
import type {
  CurrencyOption,
  CurrencyPreferences,
  MultiCurrencyConversion,
} from '@/services/currencyService';
import {
  currencyName,
  FALLBACK_CURRENCIES,
  formatCurrencyAmount,
  formatRate,
  mergeCurrencies,
} from './currency-ui';

const DEFAULT_PREFERENCES: CurrencyPreferences = {
  baseCurrency: 'CLP',
  targetCurrencies: ['EUR', 'USD', 'CHF', 'GBP'],
  feePercent: 0,
  quickAmounts: [1000, 10000, 50000, 100000],
  updatedAt: null,
};

const CARD_STYLES = [
  'from-cyan-500/15 via-sky-500/5 to-transparent border-cyan-500/20',
  'from-teal-500/15 via-emerald-500/5 to-transparent border-teal-500/20',
  'from-blue-500/15 via-indigo-500/5 to-transparent border-blue-500/20',
  'from-fuchsia-500/10 via-violet-500/5 to-transparent border-violet-500/20',
  'from-rose-500/10 via-pink-500/5 to-transparent border-rose-500/20',
  'from-lime-500/10 via-emerald-500/5 to-transparent border-lime-500/20',
];

function CurrencyPicker({
  label,
  value,
  currencies,
  onChange,
}: {
  label: string;
  value: string;
  currencies: CurrencyOption[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/15"
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} · {currencyName(currency.code)}
        </option>
      ))}
    </select>
  );
}

export function CurrencySection() {
  const [currencies, setCurrencies] =
    useState<CurrencyOption[]>(FALLBACK_CURRENCIES);
  const [preferences, setPreferences] =
    useState<CurrencyPreferences>(DEFAULT_PREFERENCES);
  const [draft, setDraft] = useState<CurrencyPreferences>(DEFAULT_PREFERENCES);
  const [amount, setAmount] = useState('1000');
  const [conversion, setConversion] = useState<MultiCurrencyConversion | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const numericAmount = Number(amount.replace(',', '.'));
  const amountIsValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const adjustedMultiplier = Math.max(0, 1 - draft.feePercent / 100);

  const targetResults = useMemo(
    () =>
      draft.targetCurrencies.map((currency) => ({
        currency,
        result: conversion?.conversions.find((item) => item.to === currency),
      })),
    [conversion, draft.targetCurrencies]
  );

  const addableCurrencies = useMemo(
    () =>
      currencies.filter(
        ({ code }) =>
          code !== draft.baseCurrency && !draft.targetCurrencies.includes(code)
      ),
    [currencies, draft.baseCurrency, draft.targetCurrencies]
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getCurrencies(controller.signal).catch(() => FALLBACK_CURRENCIES),
      getCurrencyPreferences(controller.signal),
    ])
      .then(([available, saved]) => {
        setCurrencies(mergeCurrencies(available));
        setPreferences(saved);
        setDraft(saved);
        setAmount(String(saved.quickAmounts[0] ?? 1000));
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof Error &&
          requestError.name !== 'AbortError'
        ) {
          setError(requestError.message);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!amountIsValid || draft.targetCurrencies.length === 0) {
      setConversion(null);
      setLoading(false);
      if (!amountIsValid) {
        setError(amount ? 'Ingresa un monto mayor que cero.' : null);
      }
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      convertMultipleCurrencies(
        {
          amount: numericAmount,
          from: draft.baseCurrency,
          to: draft.targetCurrencies,
        },
        controller.signal
      )
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
  }, [
    amount,
    amountIsValid,
    draft.baseCurrency,
    draft.targetCurrencies,
    numericAmount,
    refreshKey,
  ]);

  function updateBaseCurrency(baseCurrency: string) {
    setDraft((current) => {
      const targets = current.targetCurrencies.filter(
        (currency) => currency !== baseCurrency
      );
      return {
        ...current,
        baseCurrency,
        targetCurrencies: targets.length ? targets : ['EUR'],
      };
    });
  }

  function addCurrency(currency: string) {
    if (!currency) return;
    setDraft((current) => ({
      ...current,
      targetCurrencies: [...current.targetCurrencies, currency].slice(0, 6),
    }));
  }

  function removeCurrency(currency: string) {
    setDraft((current) => ({
      ...current,
      targetCurrencies: current.targetCurrencies.filter(
        (item) => item !== currency
      ),
    }));
  }

  function updateQuickAmount(index: number, value: string) {
    const parsed = Number(value);
    setDraft((current) => ({
      ...current,
      quickAmounts: current.quickAmounts.map((amountValue, amountIndex) =>
        amountIndex === index
          ? Number.isFinite(parsed)
            ? parsed
            : 0
          : amountValue
      ),
    }));
  }

  async function savePreferences() {
    const quickAmounts = draft.quickAmounts.filter(
      (value) => Number.isFinite(value) && value > 0
    );
    if (!draft.targetCurrencies.length || !quickAmounts.length) {
      setError('Elige al menos una divisa y un monto rápido.');
      return;
    }

    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const saved = await saveCurrencyPreferences({
        baseCurrency: draft.baseCurrency,
        targetCurrencies: draft.targetCurrencies,
        feePercent: draft.feePercent,
        quickAmounts,
      });
      setPreferences(saved);
      setDraft(saved);
      setSavedMessage('Preferencias sincronizadas');
      window.setTimeout(() => setSavedMessage(null), 2600);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No pudimos guardar tus preferencias.'
      );
    } finally {
      setSaving(false);
    }
  }

  const rateDate = conversion?.conversions[0]?.date;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-950 p-5 text-white shadow-2xl shadow-cyan-950/15 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[54px] border-cyan-300/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200 backdrop-blur">
                <BadgeDollarSign className="size-5" />
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-200/15 bg-cyan-200/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                Radar en vivo
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tu tablero de divisas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/65">
              Un monto, todas tus monedas importantes y una estimación más
              realista de lo que recibirás al pagar.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] p-2 backdrop-blur">
            <div className="px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-100/50">
                Fuente
              </p>
              <p className="text-xs font-semibold text-cyan-50">
                Frankfurter · Bancos centrales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              className="flex size-9 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-100 transition hover:bg-cyan-300/25 disabled:opacity-50"
              aria-label="Actualizar todas las tasas"
            >
              <RefreshCw
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">
        <section className="min-w-0 rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="multi-currency-amount"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Quiero comparar
              </label>
              <div className="flex max-w-xl gap-2">
                <input
                  id="multi-currency-amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="h-12 w-0 min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 text-xl font-bold tabular-nums outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/15"
                  aria-invalid={!amountIsValid}
                />
                <div className="w-36 shrink-0">
                  <CurrencyPicker
                    label="Moneda base del comparador"
                    value={draft.baseCurrency}
                    currencies={currencies}
                    onChange={updateBaseCurrency}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.quickAmounts.map((quickAmount, index) => (
                <button
                  key={`${quickAmount}-${index}`}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold tabular-nums transition ${
                    numericAmount === quickAmount
                      ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-teal-500/30 hover:text-teal-600'
                  }`}
                >
                  {new Intl.NumberFormat('es-CL', {
                    maximumFractionDigits: 0,
                  }).format(quickAmount)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
            >
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {targetResults.map(({ currency, result }, index) => (
              <article
                key={currency}
                className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  CARD_STYLES[index % CARD_STYLES.length]
                }`}
              >
                <div className="pointer-events-none absolute -right-7 -top-8 size-24 rounded-full border-[18px] border-current opacity-[0.035]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl border border-white/30 bg-background/80 text-sm font-black text-teal-600 shadow-sm backdrop-blur dark:text-cyan-300">
                      {currency}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {currencyName(currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        1 {draft.baseCurrency} ={' '}
                        {result ? formatRate(result.rate) : '—'} {currency}
                      </p>
                    </div>
                  </div>
                  {loading && (
                    <Loader2 className="size-4 animate-spin text-teal-500" />
                  )}
                </div>

                <div className="relative mt-6">
                  <p className="truncate text-2xl font-bold tracking-tight tabular-nums">
                    {result
                      ? formatCurrencyAmount(result.convertedAmount, currency)
                      : '—'}
                  </p>
                  {draft.feePercent > 0 && result && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/65 px-3 py-2 text-xs backdrop-blur">
                      <span className="text-muted-foreground">
                        Tras margen {draft.feePercent}%
                      </span>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatCurrencyAmount(
                          result.convertedAmount * adjustedMultiplier,
                          currency
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <CircleGauge className="size-4 text-teal-500" />
              <p className="mt-3 text-xs font-bold">Referencia clara</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                {rateDate
                  ? `Tasas publicadas el ${new Intl.DateTimeFormat('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(`${rateDate}T00:00:00Z`))}.`
                  : 'Esperando la última tasa disponible.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <CreditCard className="size-4 text-cyan-500" />
              <p className="mt-3 text-xs font-bold">Costo más real</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                {draft.feePercent
                  ? `Simulando un margen de ${draft.feePercent}% de tu medio de pago.`
                  : 'Agrega el margen de tu banco o tarjeta para afinar el cálculo.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <Sparkles className="size-4 text-violet-500" />
              <p className="mt-3 text-xs font-bold">Tu selección</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                {draft.targetCurrencies.length} monedas visibles al mismo
                tiempo, siempre listas para comparar.
              </p>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
                <Settings2 className="size-4" />
              </span>
              <h3 className="mt-4 text-lg font-bold">Tu configuración</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Se guarda en tu cuenta y te acompaña en cualquier dispositivo.
              </p>
            </div>
            {preferences.updatedAt && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                <Check className="size-3" />
                Sincronizado
              </span>
            )}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Mi moneda habitual
              </label>
              <CurrencyPicker
                label="Moneda habitual"
                value={draft.baseCurrency}
                currencies={currencies}
                onChange={updateBaseCurrency}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Monedas favoritas
                </label>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {draft.targetCurrencies.length}/6
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.targetCurrencies.map((currency) => (
                  <span
                    key={currency}
                    className="flex items-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/10 py-1.5 pl-2.5 pr-1.5 text-xs font-bold text-teal-700 dark:text-teal-200"
                  >
                    {currency}
                    <button
                      type="button"
                      onClick={() => removeCurrency(currency)}
                      disabled={draft.targetCurrencies.length === 1}
                      className="flex size-5 items-center justify-center rounded-md transition hover:bg-teal-500/15 disabled:opacity-30"
                      aria-label={`Quitar ${currency}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              {draft.targetCurrencies.length < 6 &&
                addableCurrencies.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    <select
                      aria-label="Agregar moneda favorita"
                      defaultValue=""
                      onChange={(event) => {
                        addCurrency(event.target.value);
                        event.target.value = '';
                      }}
                      className="h-9 min-w-0 flex-1 rounded-xl border border-dashed border-border bg-background px-2 text-xs font-semibold text-muted-foreground outline-none focus:border-teal-500"
                    >
                      <option value="" disabled>
                        Agregar otra moneda
                      </option>
                      {addableCurrencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} · {currencyName(currency.code)}
                        </option>
                      ))}
                    </select>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Plus className="size-3.5" />
                    </span>
                  </div>
                )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="currency-fee"
                  className="text-xs font-bold text-foreground"
                >
                  Margen banco o tarjeta
                </label>
                <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-black text-cyan-700 dark:text-cyan-200">
                  {draft.feePercent}%
                </span>
              </div>
              <input
                id="currency-fee"
                type="range"
                min="0"
                max="10"
                step="0.25"
                value={draft.feePercent}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    feePercent: Number(event.target.value),
                  }))
                }
                className="h-2 w-full cursor-pointer accent-teal-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Sin margen</span>
                <span>10%</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Montos rápidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {draft.quickAmounts.map((quickAmount, index) => (
                  <div key={index} className="relative">
                    <input
                      aria-label={`Monto rápido ${index + 1}`}
                      value={quickAmount || ''}
                      onChange={(event) =>
                        updateQuickAmount(index, event.target.value)
                      }
                      inputMode="decimal"
                      className="h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-bold tabular-nums outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedMessage ? (
              <Check className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {savedMessage ?? (saving ? 'Guardando…' : 'Guardar preferencias')}
          </button>
        </aside>
      </div>
    </div>
  );
}
