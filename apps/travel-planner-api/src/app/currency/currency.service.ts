import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ConvertMultipleCurrenciesDto } from './dto/convert-multiple-currencies.dto';
import { UpdateCurrencyPreferencesDto } from './dto/update-currency-preferences.dto';
import { CurrencyPreference } from './entities/currency-preference.entity';

interface FrankfurterCurrency {
  iso_code: string;
  name: string;
  symbol: string | null;
}

interface FrankfurterRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string | null;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export interface CurrencyPreferences {
  baseCurrency: string;
  targetCurrencies: string[];
  feePercent: number;
  quickAmounts: number[];
  updatedAt: string | null;
}

const DEFAULT_PREFERENCES: CurrencyPreferences = {
  baseCurrency: 'CLP',
  targetCurrencies: ['EUR', 'USD', 'CHF', 'GBP'],
  feePercent: 0,
  quickAmounts: [1000, 10000, 50000, 100000],
  updatedAt: null,
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly baseUrl = (
    process.env.EXCHANGE_RATES_API_URL || 'https://api.frankfurter.dev/v2'
  ).replace(/\/$/, '');
  private readonly rateTtlMs =
    this.positiveNumber(process.env.EXCHANGE_RATES_CACHE_TTL_SECONDS, 900) *
    1000;
  private readonly requestTimeoutMs = this.positiveNumber(
    process.env.EXCHANGE_RATES_TIMEOUT_MS,
    5000
  );
  private readonly rates = new Map<string, CacheEntry<FrankfurterRate>>();
  private currencies: CacheEntry<CurrencyOption[]> | null = null;

  constructor(
    @InjectRepository(CurrencyPreference)
    private readonly preferencesRepository: Repository<CurrencyPreference>
  ) {}

  async listCurrencies(): Promise<CurrencyOption[]> {
    if (this.currencies && this.currencies.expiresAt > Date.now()) {
      return this.currencies.value;
    }

    const response = await this.fetchJson<FrankfurterCurrency[]>('/currencies');
    const currencies = response
      .map(({ iso_code, name, symbol }) => ({
        code: iso_code,
        name,
        symbol,
      }))
      .sort((left, right) => left.code.localeCompare(right.code));

    this.currencies = {
      value: currencies,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    return currencies;
  }

  async convert({ from, to, amount }: ConvertCurrencyDto): Promise<{
    amount: number;
    convertedAmount: number;
    from: string;
    to: string;
    rate: number;
    date: string;
    source: string;
  }> {
    const rate = await this.getRate(from, to);
    return {
      amount,
      convertedAmount: amount * rate.rate,
      from: rate.base,
      to: rate.quote,
      rate: rate.rate,
      date: rate.date,
      source: 'Frankfurter',
    };
  }

  async convertMultiple({
    from,
    to,
    amount,
  }: ConvertMultipleCurrenciesDto): Promise<{
    amount: number;
    from: string;
    conversions: Array<{
      to: string;
      convertedAmount: number;
      rate: number;
      date: string;
    }>;
    source: string;
  }> {
    const rates = await this.getRates(from, to);
    return {
      amount,
      from,
      conversions: to.map((currency) => {
        const rate = rates.get(currency);
        if (!rate) {
          throw new BadGatewayException(
            `No fue posible obtener la tasa ${from}/${currency}`
          );
        }
        return {
          to: currency,
          convertedAmount: amount * rate.rate,
          rate: rate.rate,
          date: rate.date,
        };
      }),
      source: 'Frankfurter',
    };
  }

  async getPreferences(userId: string): Promise<CurrencyPreferences> {
    const preferences = await this.preferencesRepository.findOneBy({ userId });
    return preferences
      ? this.toPreferences(preferences)
      : { ...DEFAULT_PREFERENCES };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateCurrencyPreferencesDto
  ): Promise<CurrencyPreferences> {
    const existing = await this.preferencesRepository.findOneBy({ userId });
    const preferences = existing
      ? this.preferencesRepository.merge(existing, {
          ...dto,
          feePercent: dto.feePercent.toFixed(2),
        })
      : this.preferencesRepository.create({
          userId,
          ...dto,
          feePercent: dto.feePercent.toFixed(2),
        });
    return this.toPreferences(
      await this.preferencesRepository.save(preferences)
    );
  }

  private async getRates(
    from: string,
    currencies: string[]
  ): Promise<Map<string, FrankfurterRate>> {
    const result = new Map<string, FrankfurterRate>();
    const missing: string[] = [];

    currencies.forEach((currency) => {
      if (currency === from) {
        result.set(currency, this.identityRate(currency));
        return;
      }
      const cached = this.rates.get(`${from}/${currency}`);
      if (cached && cached.expiresAt > Date.now()) {
        result.set(currency, cached.value);
      } else {
        missing.push(currency);
      }
    });

    if (missing.length) {
      const query = new URLSearchParams({
        base: from,
        quotes: missing.join(','),
      });
      const response = await this.fetchJson<FrankfurterRate[]>(
        `/rates?${query}`
      );
      response.forEach((rate) => {
        if (
          rate.base !== from ||
          !missing.includes(rate.quote) ||
          !Number.isFinite(rate.rate) ||
          rate.rate <= 0
        ) {
          this.logger.error(
            `Invalid multi-currency rate response for ${from}/${rate.quote}`
          );
          throw new BadGatewayException(
            'El proveedor devolvió una tasa inválida'
          );
        }
        this.cacheRate(rate);
        result.set(rate.quote, rate);
      });
    }

    return result;
  }

  private async getRate(from: string, to: string): Promise<FrankfurterRate> {
    if (from === to) {
      return this.identityRate(from);
    }

    const key = `${from}/${to}`;
    const cached = this.rates.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const rate = await this.fetchJson<FrankfurterRate>(
      `/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`
    );
    if (
      rate.base !== from ||
      rate.quote !== to ||
      !Number.isFinite(rate.rate) ||
      rate.rate <= 0
    ) {
      this.logger.error(`Invalid exchange-rate response for ${key}`);
      throw new BadGatewayException('El proveedor devolvió una tasa inválida');
    }

    this.cacheRate(rate);
    return rate;
  }

  private cacheRate(rate: FrankfurterRate) {
    this.rates.set(`${rate.base}/${rate.quote}`, {
      value: rate,
      expiresAt: Date.now() + this.rateTtlMs,
    });
  }

  private identityRate(currency: string): FrankfurterRate {
    return {
      date: new Date().toISOString().slice(0, 10),
      base: currency,
      quote: currency,
      rate: 1,
    };
  }

  private toPreferences(preferences: CurrencyPreference): CurrencyPreferences {
    return {
      baseCurrency: preferences.baseCurrency,
      targetCurrencies: preferences.targetCurrencies,
      feePercent: Number(preferences.feePercent),
      quickAmounts: preferences.quickAmounts,
      updatedAt: preferences.updatedAt?.toISOString() ?? null,
    };
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        const upstreamMessage = await response
          .json()
          .then((body) =>
            typeof body?.message === 'string' ? body.message : undefined
          )
          .catch(() => undefined);
        throw new BadGatewayException(
          upstreamMessage || 'No fue posible obtener la tasa solicitada'
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      this.logger.warn(
        `Exchange-rate provider unavailable: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
      throw new ServiceUnavailableException(
        'El servicio de cambio no está disponible en este momento'
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private positiveNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
