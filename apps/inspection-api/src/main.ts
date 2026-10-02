import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from './app/app.module';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = process.env.API_PREFIX || 'api';
  const port = Number(
    process.env.INSPECTION_API_PORT || process.env.PORT || 3005
  );
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4204')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    })
  );

  await app.listen(port);
  Logger.log(
    `Inspection API running on http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
