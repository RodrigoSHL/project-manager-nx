import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.USER_API_PORT || process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 User API running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`👤 Users endpoint: http://localhost:${port}/${globalPrefix}/users`);
  Logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
