import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  In,
  IsNull,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationScopeDto } from './dto/notification-scope.dto';
import { NotificationInboxDto } from './dto/notification-inbox.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>
  ) {}

  async create(dto: CreateNotificationDto) {
    const { occurredAt, ...content } = dto;
    try {
      return await this.notifications.save(
        this.notifications.create({
          ...content,
          ...(occurredAt ? { createdAt: new Date(occurredAt) } : {}),
          type: dto.type ?? 'info',
          metadata: dto.metadata ?? {},
          eventKey: dto.eventKey ?? null,
          readAt: null,
        })
      );
    } catch (error) {
      // PostgreSQL guarantees deduplication even for concurrent producer retries.
      if (
        dto.eventKey &&
        error instanceof QueryFailedError &&
        error.driverError.code === '23505' &&
        error.driverError.constraint === 'UQ_notifications_event'
      ) {
        const existing = await this.notifications.findOneBy({
          ...this.scope(dto),
          eventKey: dto.eventKey,
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  list(query: ListNotificationsDto) {
    return this.listByScope(this.scope(query), query);
  }

  async inbox(query: NotificationInboxDto) {
    const { application, recipientId, projectIds, page, limit } = query;
    if (!projectIds.length)
      return { items: [], total: 0, unreadCount: 0, page, limit };
    const scope = { application, recipientId, projectId: In(projectIds) };
    const result = await this.listByScope(scope, query);
    const unreadCount =
      query.status === 'unread'
        ? result.total
        : await this.notifications.countBy({ ...scope, readAt: IsNull() });
    return { ...result, unreadCount };
  }

  private async listByScope(
    scope: FindOptionsWhere<Notification>,
    query: Pick<ListNotificationsDto, 'page' | 'limit' | 'status'>
  ) {
    const [items, total] = await this.notifications.findAndCount({
      where: {
        ...scope,
        ...(query.status === 'unread' ? { readAt: IsNull() } : {}),
        ...(query.status === 'read' ? { readAt: Not(IsNull()) } : {}),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async unreadCount(scope: NotificationScopeDto) {
    return {
      count: await this.notifications.countBy({
        ...this.scope(scope),
        readAt: IsNull(),
      }),
    };
  }

  async markRead(id: string, scope: NotificationScopeDto) {
    const where = { id, ...this.scope(scope) };
    await this.notifications.update(
      { ...where, readAt: IsNull() },
      { readAt: new Date() }
    );
    const notification = await this.notifications.findOneBy(where);
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  private scope({ application, projectId, recipientId }: NotificationScopeDto) {
    return { application, projectId, recipientId };
  }
}
