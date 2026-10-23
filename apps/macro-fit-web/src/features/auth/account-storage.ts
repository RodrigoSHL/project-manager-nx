import { getAccessToken, SessionChangedError } from './auth-session';

export function accountKey(userId: string, key: string) {
  return `macrofit:${encodeURIComponent(userId)}:${key}`;
}

export function createAccountStorage(userId: string) {
  const token = getAccessToken();
  const assertSession = () => {
    if (getAccessToken() !== token) throw new SessionChangedError();
  };
  return {
    getItem(key: string) {
      assertSession();
      return localStorage.getItem(accountKey(userId, key));
    },
    setItem(key: string, value: string) {
      assertSession();
      localStorage.setItem(accountKey(userId, key), value);
    },
  };
}

const LEGACY_OWNER = 'macrofit_legacy_owner';
function legacyKeys() {
  return Object.keys(localStorage).filter(
    (key) =>
      [
        'macrofit_profile',
        'macrofit_goals',
        'macrofit_custom_foods',
        'macrofit_custom_templates',
      ].includes(key) || /^macrofit_log_\d{4}-\d{2}-\d{2}$/.test(key)
  );
}
export function canImportLegacy(userId: string) {
  return !localStorage.getItem(LEGACY_OWNER) && legacyKeys().length > 0;
}
export function importLegacyData(userId: string) {
  if (!canImportLegacy(userId)) return;
  const storage = createAccountStorage(userId);
  const values = legacyKeys().map((key) => {
    const value = localStorage.getItem(key)!;
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object')
      throw new Error(
        'Los datos anteriores no tienen un formato válido. Se conserva el original.'
      );
    return { key, value };
  });
  // Preserve the originals and never replace data already entered in this account.
  for (const { key, value } of values)
    if (!storage.getItem(key)) storage.setItem(key, value);
  localStorage.setItem(LEGACY_OWNER, userId);
}
