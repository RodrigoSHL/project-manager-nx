import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ProxyMiddleware } from './proxy/proxy.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
