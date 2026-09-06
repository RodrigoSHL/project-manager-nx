export interface WorkType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
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
