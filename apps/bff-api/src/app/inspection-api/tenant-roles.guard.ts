import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import type { TenantRole } from './tenant-role';
import { TENANT_ROLES_KEY } from './tenant-roles.decorator';

@Injectable()
export class TenantRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<ExpressRequestWithUser>();
    if (request.user.roles.includes(UserRole.ADMIN)) return true;
    if (
      request.tenantAccess &&
      requiredRoles.includes(request.tenantAccess.role)
    ) {
      return true;
    }

    throw new ForbiddenException('Insufficient tenant role');
  }
}
