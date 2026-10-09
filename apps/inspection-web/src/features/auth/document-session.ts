import { getUserFromToken } from './auth-storage';

// A document and every repository it imports belong to one account for life.
// Changing accounts requires a new document, so unfinished tasks cannot switch
// databases or pick up the next account's credentials.
export const documentAccountId = getUserFromToken()?.userId ?? null;
let invalidated = false;

export function invalidateDocumentSession() {
  invalidated = true;
}

export function assertDocumentSession() {
  if (
    invalidated ||
    (getUserFromToken()?.userId ?? null) !== documentAccountId
  ) {
    invalidated = true;
    throw new Error('La cuenta cambió. Vuelve a abrir la aplicación.');
  }
}

export function accountStorageKey(
  prefix: string,
  accountId = documentAccountId
) {
  return `${prefix}:${
    accountId === null ? 'anonymous' : `user:${encodeURIComponent(accountId)}`
  }`;
}
