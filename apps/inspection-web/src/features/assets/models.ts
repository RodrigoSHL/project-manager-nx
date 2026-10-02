import type { TenantRole } from '../tenants/models';

export interface Tenant {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
  membershipRole?: TenantRole;
}

export interface Site {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'MINE' | 'PLANT' | 'SITE';
  active: boolean;
}

export interface Asset {
  id: string;
  tenantId: string;
  siteId: string;
  code: string;
  name: string;
  assetTypeId: string;
  parentId: string | null;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  description?: string | null;
}
