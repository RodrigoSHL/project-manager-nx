import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationInboxDto } from './dto/notification-inbox.dto';
import { NotificationScopeDto } from './dto/notification-scope.dto';
import { NotificationsService } from './notifications.service';
import { ServiceTokenGuard } from './service-token.guard';

@Controller('notifications')
@UseGuards(ServiceTokenGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto);
  }

  @Post('inbox')
  @HttpCode(200)
  inbox(@Body() dto: NotificationInboxDto) {
    return this.notifications.inbox(dto);
  }

  @Get()
  list(@Query() query: ListNotificationsDto) {
    return this.notifications.list(query);
  }

  @Get('unread-count')
  unreadCount(@Query() scope: NotificationScopeDto) {
    return this.notifications.unreadCount(scope);
  }

  @Patch(':id/read')
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() scope: NotificationScopeDto
  ) {
    return this.notifications.markRead(id, scope);
  }
}
