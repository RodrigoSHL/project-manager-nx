import { getAssetDescendants } from './asset-descendants';

describe('getAssetDescendants', () => {
  it('returns every generation once in stable depth-first order', () => {
    const assets = [
      { id: 'root', parentId: null },
      { id: 'child-a', parentId: 'root' },
      { id: 'grandchild', parentId: 'child-a' },
      { id: 'child-b', parentId: 'root' },
      { id: 'foreign-root', parentId: null },
      { id: 'foreign-child', parentId: 'foreign-root' },
    ];

    expect(getAssetDescendants(assets, 'root').map((item) => item.id)).toEqual([
      'child-a',
      'grandchild',
      'child-b',
    ]);
  });

  it('does not loop when corrupted input contains a cycle', () => {
    const assets = [
      { id: 'root', parentId: 'cycle-b' },
      { id: 'cycle-a', parentId: 'root' },
      { id: 'cycle-b', parentId: 'cycle-a' },
    ];

    expect(getAssetDescendants(assets, 'root').map((item) => item.id)).toEqual([
      'cycle-a',
      'cycle-b',
    ]);
  });
});
