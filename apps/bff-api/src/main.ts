import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.BFF_CORS_ORIGIN || 'http://localhost:4200',
      'http://localhost:4201',
    ],
    credentials: true,
  });

  const port = process.env.BFF_PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 BFF API running on: http://localhost:${port}`);
  Logger.log(`🔀 Proxying to: ${process.env.PROJECT_API_URL || 'http://localhost:3000'}`);
}

bootstrap();
