import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ProxyMiddleware } from './proxy/proxy.middleware';
import { JwtCookieMiddleware } from './middleware/jwt-cookie.middleware';
import { BffAuthModule } from './auth/bff-auth.module';

@Module({
  imports: [BffAuthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. JWT validation on every request (public paths are whitelisted inside the middleware)
    consumer.apply(JwtCookieMiddleware).forRoutes('*');

    // 2. Proxy everything EXCEPT /api/auth (handled by BffAuthController)
    consumer
      .apply(ProxyMiddleware)
      .exclude({ path: 'api/auth/(.*)', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}

