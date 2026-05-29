import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

/** Routes the BFF handles itself — skip JWT check for these */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
];

/** Payload shape emitted by user-api JwtService */
interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class JwtCookieMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtCookieMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.originalUrl.split('?')[0];

    if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p))) {
      return next();
    }

    const token = req.cookies?.access_token as string | undefined;
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
      });

      // Inject trusted headers so backends can read user info without JWT
      req.headers['x-user-id'] = payload.sub;
      req.headers['x-user-email'] = payload.email;
      req.headers['x-user-roles'] = payload.roles.join(',');

      this.logger.debug(`Authenticated: ${payload.email} → ${req.method} ${path}`);
      next();
    } catch {
      this.logger.warn(`Invalid JWT on ${path}`);
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
