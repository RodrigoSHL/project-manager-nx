export const tenantRoles = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'INSPECTOR',
  'VIEWER',
] as const;

export type TenantRole = (typeof tenantRoles)[number];

export const tenantWriteRoles: TenantRole[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'INSPECTOR',
];
