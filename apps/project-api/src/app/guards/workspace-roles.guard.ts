import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { WORKSPACE_ROLES_KEY, WorkspaceRole } from '../decorators/workspace-roles.decorator';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceRolesGuard.name);
  private readonly userApiUrl = process.env.USER_API_URL || 'http://localhost:3002';

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const userId = req.headers['x-user-id'] as string;
    const workspaceId =
      req.params['workspaceId'] ??
      (req.body as Record<string, string>)?.['workspaceId'];

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Missing user or workspace context');
    }

    try {
      const res = await fetch(
        `${this.userApiUrl}/api/workspaces/${workspaceId}/members/${userId}/role`,
      );

      if (!res.ok) {
        throw new ForbiddenException('Unable to verify workspace membership');
      }

      const { role } = (await res.json()) as { role: WorkspaceRole };
      const userLevel = ROLE_HIERARCHY[role] ?? -1;
      const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r]));

      if (userLevel < minRequired) {
        throw new ForbiddenException(
          `Requires workspace role: ${requiredRoles.join(' or ')}`,
        );
      }

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.error('WorkspaceRolesGuard error', err);
      throw new ForbiddenException('Unable to verify workspace membership');
    }
  }
}
