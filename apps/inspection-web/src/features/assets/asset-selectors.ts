import type { Asset } from './models';

export function getRootAssetIds(assets: Asset[]) {
  return assets
    .filter((asset) => asset.parentId === null)
    .map((asset) => asset.id);
}
