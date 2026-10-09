/** Resolve login destinations with the same URL parser used by browser navigation. */
export function safeRedirect(
  value: string | null,
  origin: string,
  fallback = '/'
): string {
  if (
    !value ||
    Array.from(value).some(
      (character) =>
        character === '\\' ||
        character.charCodeAt(0) < 32 ||
        character.charCodeAt(0) === 127
    )
  )
    return fallback;
  try {
    const base = new URL(origin);
    const target = new URL(value, base.origin);
    if (
      !['http:', 'https:'].includes(target.protocol) ||
      target.origin !== base.origin ||
      target.username ||
      target.password ||
      target.pathname.startsWith('//')
    )
      return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
