import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { MailerConfig } from './mailer.config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly config: MailerConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>();
    const authorization = request.headers.authorization;
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
      throw new UnauthorizedException(
        'A valid mailer service token is required'
      );
    }
    return true;
  }
}
