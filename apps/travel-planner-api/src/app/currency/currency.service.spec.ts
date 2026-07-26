import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  const originalFetch = global.fetch;

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

    const service = new CurrencyService();
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

    const service = new CurrencyService();
    await service.convert({ from: 'EUR', to: 'GBP', amount: 10 });
    await service.convert({ from: 'EUR', to: 'GBP', amount: 20 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not call the provider for an identity conversion', async () => {
    global.fetch = jest.fn() as jest.Mock;
    const service = new CurrencyService();

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

    const service = new CurrencyService();
    await expect(
      service.convert({ from: 'ABC', to: 'EUR', amount: 10 })
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('reports provider connectivity failures as unavailable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('offline')) as jest.Mock;

    const service = new CurrencyService();
    await expect(
      service.convert({ from: 'CLP', to: 'EUR', amount: 10 })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
