import { useMemo } from 'react';
import {
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  SearchX,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatAssetStatus } from '../asset-formatters';
import type { Asset } from '../models';

type AssetTreeProps = {
  assets: Asset[];
  expandedIds: Set<string>;
  selectedAssetId: string | null;
  searchQuery: string;
  onToggle: (assetId: string) => void;
  onSelect: (assetId: string) => void;
};

type AssetTreeNodeProps = Omit<AssetTreeProps, 'assets'> & {
  asset: Asset;
  childrenByParent: Map<string | null, Asset[]>;
  visibleIds: Set<string>;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getVisibleIds(assets: Asset[], searchQuery: string) {
  const query = normalize(searchQuery.trim());

  if (!query) {
    return new Set(assets.map((asset) => asset.id));
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const visibleIds = new Set<string>();

  for (const asset of assets) {
    const matches =
      normalize(asset.name).includes(query) ||
      normalize(asset.code).includes(query);

    if (!matches) continue;

    let current: Asset | undefined = asset;
    while (current) {
      visibleIds.add(current.id);
      current = current.parentId ? assetsById.get(current.parentId) : undefined;
    }
  }

  return visibleIds;
}

function AssetTreeNode({
  asset,
  childrenByParent,
  visibleIds,
  expandedIds,
  selectedAssetId,
  searchQuery,
  onToggle,
  onSelect,
}: AssetTreeNodeProps) {
  const children = (childrenByParent.get(asset.id) ?? []).filter((child) =>
    visibleIds.has(child.id)
  );
  const hasChildren = children.length > 0;
  const isExpanded = searchQuery.trim().length > 0 || expandedIds.has(asset.id);
  const isSelected = selectedAssetId === asset.id;
  const Icon = asset.type === 'SUBSTATION' ? Building2 : Box;

  return (
    <li>
      <div
        className={cn(
          'group flex min-h-12 items-center gap-1 rounded-lg border border-transparent pr-2 transition-colors',
          isSelected
            ? 'border-amber-300 bg-amber-50'
            : 'hover:border-slate-200 hover:bg-slate-50'
        )}
      >
        <button
          type="button"
          aria-label={
            isExpanded ? `Contraer ${asset.name}` : `Expandir ${asset.name}`
          }
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-md text-slate-500',
            hasChildren
              ? 'hover:bg-slate-200 hover:text-slate-800'
              : 'cursor-default'
          )}
          onClick={() => hasChildren && onToggle(asset.id)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <span className="size-4" />
          )}
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
          onClick={() => onSelect(asset.id)}
        >
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-md',
              asset.type === 'SUBSTATION'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">
              {asset.name}
            </span>
            <span className="block text-xs text-slate-500">
              {asset.code} · {formatAssetStatus(asset.status)}
            </span>
          </span>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <ul className="ml-5 border-l border-slate-200 pl-2">
          {children.map((child) => (
            <AssetTreeNode
              key={child.id}
              asset={child}
              childrenByParent={childrenByParent}
              visibleIds={visibleIds}
              expandedIds={expandedIds}
              selectedAssetId={selectedAssetId}
              searchQuery={searchQuery}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function AssetTree(props: AssetTreeProps) {
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Asset[]>();
    for (const asset of props.assets) {
      const siblings = map.get(asset.parentId) ?? [];
      siblings.push(asset);
      map.set(asset.parentId, siblings);
    }
    return map;
  }, [props.assets]);

  const visibleIds = useMemo(
    () => getVisibleIds(props.assets, props.searchQuery),
    [props.assets, props.searchQuery]
  );
  const roots = (childrenByParent.get(null) ?? []).filter((asset) =>
    visibleIds.has(asset.id)
  );

  if (roots.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-6 text-center">
        <div>
          <SearchX className="mx-auto size-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No encontramos activos
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba con otro nombre o código.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {roots.map((asset) => (
        <AssetTreeNode
          key={asset.id}
          asset={asset}
          childrenByParent={childrenByParent}
          visibleIds={visibleIds}
          expandedIds={props.expandedIds}
          selectedAssetId={props.selectedAssetId}
          searchQuery={props.searchQuery}
          onToggle={props.onToggle}
          onSelect={props.onSelect}
        />
      ))}
    </ul>
  );
}
