export type AssetTreeNode = {
  id: string;
  parentId: string | null;
};

/** Returns every generation below root in stable depth-first order. */
export function getAssetDescendants<T extends AssetTreeNode>(
  assets: T[],
  rootAssetId: string
): T[] {
  const childrenByParent = new Map<string, T[]>();
  for (const asset of assets) {
    if (!asset.parentId) continue;
    const children = childrenByParent.get(asset.parentId) ?? [];
    children.push(asset);
    childrenByParent.set(asset.parentId, children);
  }

  const descendants: T[] = [];
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
