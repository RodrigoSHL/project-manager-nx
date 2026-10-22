import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  const globalPrefix = process.env.API_PREFIX || 'api';
  const port = Number(
    process.env.MACRO_FIT_API_PORT || process.env.PORT || 3007
  );
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 MacroFit API running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
