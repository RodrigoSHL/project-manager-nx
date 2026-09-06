export interface AssetType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}
