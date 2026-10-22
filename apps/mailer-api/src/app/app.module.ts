import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MailerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
