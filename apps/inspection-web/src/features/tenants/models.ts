export const tenantRoles = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'INSPECTOR',
  'VIEWER',
] as const;

export type TenantRole = (typeof tenantRoles)[number];

export const tenantRoleLabels: Record<TenantRole, string> = {
  TENANT_ADMIN: 'Administrador del tenant',
  SUPERVISOR: 'Supervisor',
  INSPECTOR: 'Inspector',
  VIEWER: 'Consulta',
};
