export interface WorkType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface AssetTypeWorkType {
  id: string;
  tenantId: string;
  assetTypeId: string;
  workTypeId: string;
  enabled: boolean;
}

export interface AssetWorkType {
  id: string;
  tenantId: string;
  assetId: string;
  workTypeId: string;
  enabled: boolean;
}

export interface EffectiveWorkType extends WorkType {
  source: 'ASSET' | 'ASSET_TYPE';
}

export interface AssetTypeWorkTypeOption extends WorkType {
  associated: boolean;
}

export interface AssetWorkTypeConfiguration extends WorkType {
  typeEnabled: boolean;
  override: boolean | null;
  effectiveEnabled: boolean;
  source: 'ASSET' | 'ASSET_TYPE' | 'NONE';
}
