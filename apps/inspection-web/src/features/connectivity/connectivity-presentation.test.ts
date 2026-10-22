import { describe, expect, it } from 'vitest';
import { connectionPresentation } from './connectivity-presentation';

describe('connection presentation', () => {
  it('shows a neutral check before the server availability is known', () => {
    expect(
      connectionPresentation({
        browserOnline: true,
        apiReachable: false,
        checking: true,
      }).status
    ).toBe('checking');
  });
  it('keeps a confirmed connection online during a background check', () => {
    expect(
      connectionPresentation({
        browserOnline: true,
        apiReachable: true,
        checking: true,
      }).status
    ).toBe('online');
  });
  it('reports a failed server only after the check ends', () => {
    expect(
      connectionPresentation({
        browserOnline: true,
        apiReachable: false,
        checking: false,
      }).status
    ).toBe('unavailable');
  });
  it('distinguishes a device without connectivity from an unavailable server', () => {
    expect(
      connectionPresentation({
        browserOnline: false,
        apiReachable: false,
        checking: false,
      }).status
    ).toBe('offline');
  });
});
