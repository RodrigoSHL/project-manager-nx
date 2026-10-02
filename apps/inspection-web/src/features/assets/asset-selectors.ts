import type { Asset } from './models';

export function getRootAssetIds(assets: Asset[]) {
  return assets
    .filter((asset) => asset.parentId === null)
    .map((asset) => asset.id);
}

/** Assets must already be scoped to one tenant and site. */
export function getAssetDescendants(assets: Asset[], rootAssetId: string) {
  const childrenByParent = new Map<string, Asset[]>();
  for (const asset of assets) {
    if (!asset.parentId) continue;
    const children = childrenByParent.get(asset.parentId) ?? [];
    children.push(asset);
    childrenByParent.set(asset.parentId, children);
  }

  const descendants: Asset[] = [];
  const visited = new Set([rootAssetId]);
  const visit = (parentId: string) => {
    for (const child of childrenByParent.get(parentId) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      descendants.push(child);
      visit(child.id);
    }
  };
  visit(rootAssetId);
  return descendants;
}
