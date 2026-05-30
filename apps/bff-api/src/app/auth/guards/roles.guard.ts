import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user-api/user-api.client';
import { ExpressRequestWithUser } from '../types/express-request-with-user';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ExpressRequestWithUser>();
    const userRoles = request.user?.roles || [];

    if (requiredRoles.some((role) => userRoles.includes(role))) {
      return true;
    }

    throw new ForbiddenException('Insufficient roles');
  }
}
