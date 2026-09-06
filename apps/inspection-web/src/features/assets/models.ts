export interface Tenant {
  id: string;
  name: string;
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
  type: string;
  parentId: string | null;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  description?: string | null;
}
