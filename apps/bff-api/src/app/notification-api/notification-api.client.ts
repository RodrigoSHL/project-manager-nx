import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { JiraNotificationQuery } from './jira-notifications.controller';

interface NotificationRecord {
  id: string;
  projectId: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  metadata?: Record<string, unknown>;
}

interface InboxResponse {
  items: NotificationRecord[];
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
}

@Injectable()
export class NotificationApiClient {
  async inbox(
    recipientId: string,
    projectIds: string[],
    query: JiraNotificationQuery
  ) {
    const response = await this.request<InboxResponse>('/notifications/inbox', {
      method: 'POST',
      body: JSON.stringify({
        application: 'jira',
        recipientId,
        projectIds,
        page: query.page,
        limit: query.limit,
        status: query.status,
      }),
    });
    return {
      items: response.items.map((item) => this.toPublicRecord(item)),
      page: response.page,
      limit: response.limit,
      total: response.total,
      unreadCount: response.unreadCount,
    };
  }

  async markRead(recipientId: string, projectId: string, id: string) {
    const scope = new URLSearchParams({
      application: 'jira',
      recipientId,
      projectId,
    });
    const result = await this.request<NotificationRecord>(
      `/notifications/${encodeURIComponent(id)}/read?${scope}`,
      { method: 'PATCH' }
    );
    return { id: result.id, readAt: result.readAt };
  }

  private toPublicRecord(record: NotificationRecord) {
    const { id, projectId, type, title, body, createdAt, readAt, metadata } =
      record;
    return {
      id,
      projectId,
      type,
      title,
      body,
      createdAt,
      readAt,
      projectName:
        typeof metadata?.projectName === 'string'
          ? metadata.projectName
          : undefined,
      ticketKey:
        typeof metadata?.ticketKey === 'string'
          ? metadata.ticketKey
          : undefined,
      ticketId:
        typeof metadata?.ticketId === 'string' ? metadata.ticketId : undefined,
      commentId:
        typeof metadata?.commentId === 'string'
          ? metadata.commentId
          : undefined,
    };
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = process.env.NOTIFICATION_SERVICE_TOKEN;
    const baseUrl = process.env.NOTIFICATION_API_URL;
    if (!token || !baseUrl)
      throw new ServiceUnavailableException('Notifications unavailable');

    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
    } catch {
      throw new ServiceUnavailableException('Notifications unavailable');
    }
    if (response.status === 404 && init.method === 'PATCH') {
      throw new NotFoundException('Notification not found');
    }
    if (!response.ok)
      throw new ServiceUnavailableException('Notifications unavailable');
    return response.json();
  }
}
