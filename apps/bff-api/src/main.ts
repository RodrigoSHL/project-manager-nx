import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.BFF_CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 0, // No cachear preflight en desarrollo
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.BFF_PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 BFF API running on: http://localhost:${port}`);
  Logger.log(`👤 User API: ${process.env.USER_API_URL || 'http://localhost:3001'}`);
  Logger.log(`📊 Project API: ${process.env.PROJECT_API_URL || 'http://localhost:3002'}`);
}

bootstrap();
