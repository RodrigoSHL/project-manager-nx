import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication) {
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
