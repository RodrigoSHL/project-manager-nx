import type { Asset } from '../assets/models';
import type { AssetType } from './models';

export function findAssetType(asset: Asset, assetTypes: AssetType[]) {
  return assetTypes.find(
    (item) => item.tenantId === asset.tenantId && item.id === asset.assetTypeId
  );
}

export function isSubstationAsset(asset: Asset, assetTypes: AssetType[]) {
  return findAssetType(asset, assetTypes)?.code === 'SUBSTATION';
}
