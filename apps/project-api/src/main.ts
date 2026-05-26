/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';

// Cargar variables de entorno desde el archivo .env en la raíz
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env desde la raíz del monorepo
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS — soporta múltiples orígenes separados por coma
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);
  
  const port = process.env.API_PORT || process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📊 Projects API available at: http://localhost:${port}/${globalPrefix}/projects`
  );
  Logger.log(
    `🔧 Environment: ${process.env.NODE_ENV || 'development'}`
  );
}

bootstrap();
