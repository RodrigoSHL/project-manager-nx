import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationConfig } from '../config/notification.config';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ServiceTokenGuard } from './service-token.guard';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationConfig, NotificationsService, ServiceTokenGuard],
  exports: [NotificationConfig],
})
export class NotificationsModule {}
