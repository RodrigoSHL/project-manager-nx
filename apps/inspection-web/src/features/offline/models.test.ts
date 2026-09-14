import { describe, expect, it } from 'vitest';
import { resolveDataSourceMode } from './models';

describe('resolveDataSourceMode', () => {
  it('fuerza IndexedDB cuando la API no responde', () => {
    expect(resolveDataSourceMode('REMOTE', false)).toBe('LOCAL');
  });

  it('respeta la preferencia cuando la API está disponible', () => {
    expect(resolveDataSourceMode('REMOTE', true)).toBe('REMOTE');
    expect(resolveDataSourceMode('LOCAL', true)).toBe('LOCAL');
  });
});
