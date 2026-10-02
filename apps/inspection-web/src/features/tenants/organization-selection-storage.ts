type OrganizationSelection = {
  tenantId?: string;
  siteIdByTenant: Record<string, string>;
};

const storageKeyPrefix = 'inspection.organization-selection.v1';

function emptySelection(): OrganizationSelection {
  return { siteIdByTenant: {} };
}

function storageKey(userId: string) {
  return `${storageKeyPrefix}:${userId}`;
}

function readSelection(userId: string): OrganizationSelection {
  if (!userId || typeof window === 'undefined') return emptySelection();

  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return emptySelection();

    const parsed = JSON.parse(stored) as Partial<OrganizationSelection>;
    return {
      tenantId:
        typeof parsed.tenantId === 'string' ? parsed.tenantId : undefined,
      siteIdByTenant:
        parsed.siteIdByTenant && typeof parsed.siteIdByTenant === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.siteIdByTenant).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === 'string'
              )
            )
          : {},
    };
  } catch {
    return emptySelection();
  }
}

function writeSelection(userId: string, selection: OrganizationSelection) {
  if (!userId || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(selection));
  } catch {
    // La preferencia es opcional; la aplicación puede continuar sin persistirla.
  }
}

export function resolveAvailableSelection<T extends { id: string }>(
  items: T[],
  ...candidates: Array<string | null | undefined>
) {
  return (
    candidates.find(
      (candidate) => candidate && items.some((item) => item.id === candidate)
    ) ??
    items[0]?.id ??
    ''
  );
}

export const organizationSelectionStorage = {
  getTenantId(userId: string) {
    return readSelection(userId).tenantId ?? null;
  },

  rememberTenant(userId: string, tenantId: string) {
    const selection = readSelection(userId);
    writeSelection(userId, { ...selection, tenantId });
  },

  getSiteId(userId: string, tenantId: string) {
    return readSelection(userId).siteIdByTenant[tenantId] ?? null;
  },

  rememberSite(userId: string, tenantId: string, siteId: string) {
    const selection = readSelection(userId);
    writeSelection(userId, {
      ...selection,
      tenantId,
      siteIdByTenant: {
        ...selection.siteIdByTenant,
        [tenantId]: siteId,
      },
    });
  },
};
