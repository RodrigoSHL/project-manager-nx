import { safeRedirect } from '@project-manager/security-navigation';

describe('login return URLs', () => {
  const origin = 'https://app.example.com';
  it.each([
    'https://attacker.invalid/path',
    '//attacker.invalid',
    '/\\attacker.invalid',
    '/\t/attacker.invalid',
    '/\n/attacker.invalid',
    'javascript:alert(1)',
    'https://app.example.com.evil.invalid/',
    'https://user:pass@app.example.com/',
    'https://app.example.com//attacker.invalid',
    '/a/..//attacker.invalid',
    'https://app.example.com:444/',
    '\\attacker.invalid',
  ])('rejects %s', (value) => {
    expect(safeRedirect(value, origin)).toBe('/');
  });
  it.each([
    ['/projects?view=board#ticket', '/projects?view=board#ticket'],
    [
      'https://app.example.com/trips/123?tab=files#photo',
      '/trips/123?tab=files#photo',
    ],
    ['/a/../projects', '/projects'],
    ['/search?q=a%20b', '/search?q=a%20b'],
    ['/search?q=a b', '/search?q=a%20b'],
  ])('preserves internal destination %s', (value, expected) => {
    expect(safeRedirect(value, origin)).toBe(expected);
  });
  it('uses each application fallback', () => {
    expect(safeRedirect(null, origin, '/dashboard')).toBe('/dashboard');
    expect(safeRedirect('//evil.invalid', origin, '/dashboard')).toBe(
      '/dashboard'
    );
  });
});
