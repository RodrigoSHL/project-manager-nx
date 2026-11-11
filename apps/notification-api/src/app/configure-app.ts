import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(
    app.get(ConfigService).get<string>('API_PREFIX') || 'api'
  );
  app.use(json({ limit: '256kb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    })
  );
}
