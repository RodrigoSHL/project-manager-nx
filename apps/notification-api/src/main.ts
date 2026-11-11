import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';
import { NotificationConfig } from './app/config/notification.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  app.enableShutdownHooks();
  const { port } = app.get(NotificationConfig);
  await app.listen(port);
  Logger.log(`Notification API listening on port ${port}`, 'Bootstrap');
}

bootstrap();
