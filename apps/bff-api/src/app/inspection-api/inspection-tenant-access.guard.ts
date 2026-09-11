import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import { InspectionApiClient } from './inspection-api.client';

@Injectable()
export class InspectionTenantAccessGuard implements CanActivate {
  constructor(private readonly client: InspectionApiClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        ExpressRequestWithUser & { params?: { tenantId?: string } }
      >();
    const tenantId = request.params?.tenantId;

    if (!tenantId || request.user.roles.includes(UserRole.ADMIN)) return true;

    const { hasAccess } = await this.client.hasTenantAccess(
      request.user.userId,
      tenantId
    );
    if (hasAccess) return true;

    throw new ForbiddenException('Tenant access denied');
  }
}
