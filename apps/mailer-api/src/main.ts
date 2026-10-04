import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';
import { MailerConfig } from './app/mailer/mailer.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  app.enableShutdownHooks();
  const config = app.get(MailerConfig);
  await app.listen(config.port, '0.0.0.0');
  Logger.log(`Mailer API listening on port ${config.port}`, 'Bootstrap');
}

bootstrap();
