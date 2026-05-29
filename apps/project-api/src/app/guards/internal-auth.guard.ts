import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Ensures the request came through the BFF (has X-User-Id header).
 * Apply globally in AppModule or per-controller/route as needed.
 * Backends should only be reachable from the internal network,
 * but this is a safety net for direct access attempts.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new UnauthorizedException('Missing internal auth headers');
    }
    return true;
  }
}
