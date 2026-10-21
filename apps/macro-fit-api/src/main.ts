import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from './app/app.module';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = Number(process.env.MACRO_FIT_API_PORT || process.env.PORT || 3007);
  const envOrigins = (process.env.MACROFIT_CORS_ORIGIN || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'https://macrofit.atomdev.cl',
    'http://localhost:4205',
    'http://localhost:3000',
  ];

  const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || origin.endsWith('.atomdev.cl')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  await app.listen(port);
  Logger.log(
    `🚀 MacroFit API running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
