import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

export function configureApp(app: INestApplication) {
  // A bounded JSON import may contain several historical days.
  (app as NestExpressApplication).useBodyParser('json', { limit: '5mb' });
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  const origins = (
    process.env.CORS_ORIGIN ??
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4205')
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    })
  );
}
