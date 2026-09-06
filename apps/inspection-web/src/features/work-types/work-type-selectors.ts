import {
  mockAssetTypeWorkTypes,
  mockAssetWorkTypes,
  mockWorkTypes,
} from '../../mocks/asset-work-type-catalog';
import type { Asset } from '../assets/models';
import type { WorkType } from './models';

export type EffectiveWorkType = {
  workType: WorkType;
  source: 'ASSET' | 'ASSET_TYPE';
};

export function listWorkTypesByTenant(tenantId: string) {
  return mockWorkTypes.filter((item) => item.tenantId === tenantId);
}

export function getEffectiveWorkTypes(asset: Asset): EffectiveWorkType[] {
  const effectiveWorkTypes: EffectiveWorkType[] = [];

  for (const workType of listWorkTypesByTenant(asset.tenantId)) {
    if (!workType.active) continue;

    const assetRule = mockAssetWorkTypes.find(
      (rule) =>
        rule.tenantId === asset.tenantId &&
        rule.assetId === asset.id &&
        rule.workTypeId === workType.id
    );

    if (assetRule) {
      if (assetRule.enabled) {
        effectiveWorkTypes.push({ workType, source: 'ASSET' });
      }
      continue;
    }

    const assetTypeRule = mockAssetTypeWorkTypes.find(
      (rule) =>
        rule.tenantId === asset.tenantId &&
        rule.assetTypeId === asset.assetTypeId &&
        rule.workTypeId === workType.id
    );

    if (assetTypeRule?.enabled) {
      effectiveWorkTypes.push({ workType, source: 'ASSET_TYPE' });
    }
  }

  return effectiveWorkTypes.sort((left, right) =>
    left.workType.name.localeCompare(right.workType.name, 'es')
  );
}
