import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectApiModule } from '../project-api/project-api.module';
import { JiraNotificationsController } from './jira-notifications.controller';
import { NotificationApiClient } from './notification-api.client';

@Module({
  imports: [AuthModule, ProjectApiModule],
  controllers: [JiraNotificationsController],
  providers: [NotificationApiClient],
})
export class NotificationApiModule {}
