import type { Asset, Site } from './models';

export function getSitesForTenant(sites: Site[], tenantId: string) {
  return sites.filter((site) => site.tenantId === tenantId);
}

export function getAssetsForContext(
  assets: Asset[],
  tenantId: string,
  siteId: string
) {
  return assets.filter(
    (asset) => asset.tenantId === tenantId && asset.siteId === siteId
  );
}

export function getRootAssetIds(assets: Asset[]) {
  return assets
    .filter((asset) => asset.parentId === null)
    .map((asset) => asset.id);
}
