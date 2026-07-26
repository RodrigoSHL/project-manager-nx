import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

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

  private async getRate(from: string, to: string): Promise<FrankfurterRate> {
    if (from === to) {
      return {
        date: new Date().toISOString().slice(0, 10),
        base: from,
        quote: to,
        rate: 1,
      };
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

    this.rates.set(key, {
      value: rate,
      expiresAt: Date.now() + this.rateTtlMs,
    });
    return rate;
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
