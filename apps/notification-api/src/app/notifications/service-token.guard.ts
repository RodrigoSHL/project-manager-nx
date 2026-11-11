import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { NotificationConfig } from '../config/notification.config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly config: NotificationConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const { authorization } = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>().headers;
    const token =
      typeof authorization === 'string' && /^Bearer /i.test(authorization)
        ? authorization.slice(7)
        : '';
    const received = Buffer.from(token);
    const expected = Buffer.from(this.config.serviceToken);
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid notification service token');
    }
    return true;
  }
}
