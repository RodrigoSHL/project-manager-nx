import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CurrencyService } from './currency.service';
import { CurrencyPreference } from './entities/currency-preference.entity';

describe('CurrencyService', () => {
  const originalFetch = global.fetch;

  function createService(preferences?: Partial<CurrencyPreference>) {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(preferences ?? null),
      create: jest.fn((value) => value),
      merge: jest.fn((target, value) => Object.assign(target, value)),
      save: jest.fn(async (value) => ({
        ...value,
        updatedAt: new Date('2026-07-26T12:00:00.000Z'),
      })),
    } as unknown as Repository<CurrencyPreference>;
    return { repository, service: new CurrencyService(repository) };
  }

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('converts an amount using the provider rate', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-07-24',
        base: 'CLP',
        quote: 'EUR',
        rate: 0.00092,
      }),
    }) as jest.Mock;

    const { service } = createService();
    await expect(
      service.convert({ from: 'CLP', to: 'EUR', amount: 100000 })
    ).resolves.toEqual({
      amount: 100000,
      convertedAmount: 92,
      from: 'CLP',
      to: 'EUR',
      rate: 0.00092,
      date: '2026-07-24',
      source: 'Frankfurter',
    });
  });

  it('reuses a cached rate for the same currency pair', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-07-24',
        base: 'EUR',
        quote: 'GBP',
        rate: 0.86,
      }),
    }) as jest.Mock;

    const { service } = createService();
    await service.convert({ from: 'EUR', to: 'GBP', amount: 10 });
    await service.convert({ from: 'EUR', to: 'GBP', amount: 20 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not call the provider for an identity conversion', async () => {
    global.fetch = jest.fn() as jest.Mock;
    const { service } = createService();

    const result = await service.convert({
      from: 'EUR',
      to: 'EUR',
      amount: 25,
    });

    expect(result.rate).toBe(1);
    expect(result.convertedAmount).toBe(25);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards a useful provider validation error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Could not find currency ABC' }),
    }) as jest.Mock;

    const { service } = createService();
    await expect(
      service.convert({ from: 'ABC', to: 'EUR', amount: 10 })
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('reports provider connectivity failures as unavailable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('offline')) as jest.Mock;

    const { service } = createService();
    await expect(
      service.convert({ from: 'CLP', to: 'EUR', amount: 10 })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('converts several favorite currencies with one provider request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { date: '2026-07-26', base: 'CLP', quote: 'EUR', rate: 0.00093 },
        { date: '2026-07-26', base: 'CLP', quote: 'USD', rate: 0.00108 },
        { date: '2026-07-26', base: 'CLP', quote: 'GBP', rate: 0.0008 },
      ],
    }) as jest.Mock;

    const { service } = createService();
    const result = await service.convertMultiple({
      from: 'CLP',
      to: ['EUR', 'USD', 'GBP'],
      amount: 1000,
    });

    expect(result.conversions).toEqual([
      {
        to: 'EUR',
        convertedAmount: 0.93,
        rate: 0.00093,
        date: '2026-07-26',
      },
      {
        to: 'USD',
        convertedAmount: 1.08,
        rate: 0.00108,
        date: '2026-07-26',
      },
      {
        to: 'GBP',
        convertedAmount: 0.8,
        rate: 0.0008,
        date: '2026-07-26',
      },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rates?base=CLP&quotes=EUR%2CUSD%2CGBP'),
      expect.any(Object)
    );
  });

  it('returns defaults and persists personalized preferences', async () => {
    const { repository, service } = createService();
    await expect(service.getPreferences('user-1')).resolves.toMatchObject({
      baseCurrency: 'CLP',
      targetCurrencies: ['EUR', 'USD', 'CHF', 'GBP'],
      feePercent: 0,
    });

    const saved = await service.updatePreferences('user-1', {
      baseCurrency: 'CLP',
      targetCurrencies: ['EUR', 'CHF'],
      feePercent: 2.5,
      quickAmounts: [1000, 5000],
    });

    expect(saved).toMatchObject({
      baseCurrency: 'CLP',
      targetCurrencies: ['EUR', 'CHF'],
      feePercent: 2.5,
      quickAmounts: [1000, 5000],
    });
    expect(repository.save).toHaveBeenCalled();
  });
});
