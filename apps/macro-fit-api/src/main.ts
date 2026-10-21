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
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4205')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
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
