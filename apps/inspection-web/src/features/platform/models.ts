export interface PlatformTenant {
  id: string;
  code: string;
  name: string;
  active: boolean;
  siteCount: number;
  assetCount: number;
  workCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTenantUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  hasAccess: boolean;
}
