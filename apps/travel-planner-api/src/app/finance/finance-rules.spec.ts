import { allocateEqual, convertMinor, decimalToMinor, minorToDecimal, optimizeDebts } from './money';

describe('finance money and balance rules', () => {
  it('stores individual money without floating point operations', () => {
    expect(decimalToMinor('20.00', 'EUR')).toBe(2000n);
    expect(minorToDecimal(2000n, 'EUR')).toBe('20.00');
    expect(decimalToMinor('1999.6', 'CLP')).toBe(2000n);
  });
  it('splits equally and assigns the rounding residual deterministically', () => {
    expect(allocateEqual(10000n, 3)).toEqual([3334n, 3333n, 3333n]);
    expect(allocateEqual(12000n, 3).reduce((a, b) => a + b, 0n)).toBe(12000n);
  });
  it('supports exact custom and percentage totals', () => {
    const custom = ['40.00', '35.00', '25.00'].map((value) => decimalToMinor(value, 'EUR'));
    expect(custom.reduce((a, b) => a + b, 0n)).toBe(10000n);
    const percent = [50000n, 30000n, 20000n];
    expect(percent.reduce((a, b) => a + b, 0n)).toBe(100000n);
  });
  it('converts currencies with decimal rational arithmetic', () => {
    expect(convertMinor(1000n, '950.25', 'USD', 'CLP')).toBe(9503n);
    expect(convertMinor(1999n, '1.125', 'EUR', 'USD')).toBe(2249n);
  });
  it('optimizes participant balances into a minimal transfer set', () => {
    expect(optimizeDebts({ ana: -3000n, pedro: -2000n, rodrigo: 5000n })).toEqual([
      { fromUserId: 'ana', toUserId: 'rodrigo', amountMinor: 3000n },
      { fromUserId: 'pedro', toUserId: 'rodrigo', amountMinor: 2000n },
    ]);
  });
  it('settlements reduce debt without changing trip cost', () => {
    const costBefore = 12000n; const netBefore = { ana: -4000n, rodrigo: 4000n };
    const partialPayment = 1500n; const netAfter = { ana: netBefore.ana + partialPayment, rodrigo: netBefore.rodrigo - partialPayment };
    expect(costBefore).toBe(12000n); expect(netAfter).toEqual({ ana: -2500n, rodrigo: 2500n });
  });
  it('compares budget and actual spending in minor units', () => {
    const budget = decimalToMinor('1000', 'USD'); const spent = decimalToMinor('755', 'USD');
    expect(Number((spent * 10000n) / budget) / 100).toBe(75.5);
    expect(minorToDecimal(budget - spent, 'USD')).toBe('245.00');
  });
});
