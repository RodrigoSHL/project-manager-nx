import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the authenticated user info from X-User-* headers
 * injected by the BFF JWT middleware. Backends never validate JWT directly.
 *
 * Usage: @CurrentUser() user: RequestUser
 */
export interface RequestUser {
  id: string;
  email: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return {
      id: req.headers['x-user-id'] as string,
      email: req.headers['x-user-email'] as string,
      roles: ((req.headers['x-user-roles'] as string) || '').split(',').filter(Boolean),
    };
  },
);
