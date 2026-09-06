import type { Asset } from '../assets/models';
import { mockAssetTypes } from '../../mocks/asset-work-type-catalog';

const legacyPrefix = 'legacy:';

export function listAssetTypesByTenant(tenantId: string) {
  return mockAssetTypes.filter((item) => item.tenantId === tenantId);
}

export function findAssetType(tenantId: string, assetTypeId: string) {
  return mockAssetTypes.find(
    (item) => item.tenantId === tenantId && item.id === assetTypeId
  );
}

export function assetTypeIdFromCode(tenantId: string, code: string) {
  return (
    mockAssetTypes.find(
      (item) => item.tenantId === tenantId && item.code === code
    )?.id ?? `${legacyPrefix}${tenantId}:${code}`
  );
}

export function assetTypeCodeFromId(tenantId: string, assetTypeId: string) {
  const assetType = findAssetType(tenantId, assetTypeId);
  if (assetType) return assetType.code;

  const prefix = `${legacyPrefix}${tenantId}:`;
  return assetTypeId.startsWith(prefix)
    ? assetTypeId.slice(prefix.length)
    : assetTypeId;
}

export function isSubstationAsset(asset: Asset) {
  return (
    assetTypeCodeFromId(asset.tenantId, asset.assetTypeId) === 'SUBSTATION'
  );
}
