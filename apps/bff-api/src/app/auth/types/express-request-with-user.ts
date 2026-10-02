import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user';
import type { TenantRole } from '../../inspection-api/tenant-role';

export interface ExpressRequestWithUser extends Request {
  user: AuthenticatedUser;
  tenantAccess?: {
    tenantId: string;
    role: TenantRole;
  };
}
