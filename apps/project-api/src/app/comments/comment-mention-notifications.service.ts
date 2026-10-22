import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { isEmail } from 'class-validator';
import { Comment } from './entities/comment.entity';
import {
  CommentMentionNotification,
  MentionEmailPayload,
} from './entities/comment-mention-notification.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { parseCommentMentions } from './comment-mentions';

class DeliveryError extends Error {
  constructor(readonly code: string, readonly retryable: boolean) {
    super(code);
  }
}

@Injectable()
export class CommentMentionNotificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CommentMentionNotificationsService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  constructor(
    @InjectRepository(CommentMentionNotification)
    private readonly notifications: Repository<CommentMentionNotification>
  ) {}

  get enabled() {
    return process.env.JIRA_MENTION_EMAILS_ENABLED === 'true';
  }

  onModuleInit() {
    if (!this.enabled) return;
    if (
      !process.env.MAILER_SERVICE_TOKEN ||
      !process.env.MAILER_API_URL ||
      !process.env.USER_API_URL
    ) {
      throw new Error(
        'Jira mention emails require MAILER_SERVICE_TOKEN, MAILER_API_URL and USER_API_URL'
      );
    }
    this.timer = setInterval(() => {
      void this.processNext();
    }, 5000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }

  async enqueue(manager: EntityManager, comment: Comment, previousBody = '') {
    if (!this.enabled) return;
    const parsed = parseCommentMentions(comment.body);
    const previous = parseCommentMentions(previousBody).memberIds;
    const ids = [...parsed.memberIds].filter((id) => !previous.has(id));
    if (!ids.length) return;
    const ticket = await manager.findOne(Ticket, {
      where: { id: comment.ticketId },
      relations: ['project'],
    });
    if (!ticket?.project?.workspaceId) return;
    const members = await manager.find(TeamMember, {
      where: { projectId: ticket.projectId, isActive: true, id: In(ids) },
    });
    const author = await manager.findOne(TeamMember, {
      where: [
        { projectId: ticket.projectId, userId: comment.authorId },
        { projectId: ticket.projectId, id: comment.authorId },
      ],
    });
    const recipients = new Set<string>();
    for (const member of members) {
      if (
        !member.userId ||
        member.userId === comment.authorId ||
        member.id === comment.authorId ||
        recipients.has(member.userId)
      )
        continue;
      recipients.add(member.userId);
      const payload: MentionEmailPayload = {
        to: [member.email],
        recipientName: member.name,
        authorName: author?.name || 'Un miembro del equipo',
        projectName: ticket.project.name,
        ticketKey: ticket.key,
        ticketTitle: ticket.title,
        commentText:
          parsed.text.length > 5999
            ? parsed.text.slice(0, 5999) + '…'
            : parsed.text,
        workspaceId: ticket.project.workspaceId,
        projectId: ticket.projectId,
        ticketId: ticket.id,
        commentId: comment.id,
      };
      await manager
        .createQueryBuilder()
        .insert()
        .into(CommentMentionNotification)
        .values({
          commentId: comment.id,
          memberId: member.id,
          recipientUserId: member.userId,
          payload,
        })
        .orIgnore()
        .execute();
    }
  }

  async processNext() {
    if (this.running || !this.enabled) return;
    this.running = this.runOnce().catch(() => {
      this.logger.warn('Mention notification worker unavailable');
    });
    try {
      await this.running;
    } finally {
      this.running = undefined;
    }
  }

  private async runOnce() {
    // Claims and leases are atomic across replicas. Network calls happen outside DB transactions.
    await this.notifications
      .query(`UPDATE "comment_mention_notifications" SET "status"='failed', "lastCode"='retry_window_expired', "lockedUntil"=NULL
      WHERE "status" IN ('pending','processing') AND ("lockedUntil" IS NULL OR "lockedUntil" <= now())
      AND ("attempts" >= 8 OR "createdAt" < now() - interval '23 hours')`);
    const rows: CommentMentionNotification[] = await this.notifications
      .query(`WITH claimed AS (UPDATE "comment_mention_notifications" SET "status"='processing', "attempts"="attempts"+1, "lockedUntil"=now()+interval '2 minutes'
      WHERE "id" IN (SELECT "id" FROM "comment_mention_notifications"
        WHERE (("status"='pending' AND "nextAttemptAt"<=now()) OR ("status"='processing' AND "lockedUntil"<=now()))
        AND "attempts"<8 AND "createdAt">now()-interval '23 hours'
        ORDER BY "nextAttemptAt" LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *) SELECT * FROM claimed`);
    const notification = rows[0];
    if (!notification) return;
    try {
      const payload = await this.authorizedPayload(notification);
      if (!payload) {
        await this.finish(
          notification.id,
          'skipped',
          'recipient_no_longer_eligible'
        );
        return;
      }
      const response = await fetch(
        `${this.baseUrl(
          'MAILER_API_URL'
        )}/emails/templates/jira-comment-mention`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${process.env.MAILER_SERVICE_TOKEN}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `jira-mention/${notification.commentId}/${notification.recipientUserId}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response.json().catch(() => ({}))) as {
        status?: string;
        code?: string;
        retryable?: boolean;
      };
      if (!response.ok) {
        const code =
          typeof result.code === 'string' && /^[a-z_]{1,100}$/.test(result.code)
            ? result.code
            : 'mailer_rejected';
        throw new DeliveryError(
          code,
          result.retryable === true ||
            (result.retryable === undefined && response.status >= 500)
        );
      }
      if (!['accepted', 'simulated'].includes(result.status || ''))
        throw new DeliveryError('mailer_invalid_response', true);
      await this.finish(notification.id, 'sent', result.status || 'accepted');
    } catch (error) {
      const code =
        error instanceof DeliveryError ? error.code : 'delivery_unavailable';
      const retryable = !(error instanceof DeliveryError) || error.retryable;
      if (!retryable || notification.attempts >= 8) {
        await this.finish(notification.id, 'failed', code);
        this.logger.warn(
          `Mention notification ${notification.id} failed (${code})`
        );
      } else {
        await this.notifications.update(notification.id, {
          status: 'pending',
          lastCode: code,
          lockedUntil: null,
          nextAttemptAt: new Date(
            Date.now() +
              Math.min(600000, 5000 * 2 ** (notification.attempts - 1))
          ),
        });
      }
    }
  }

  private async authorizedPayload(
    notification: CommentMentionNotification
  ): Promise<MentionEmailPayload | null> {
    const manager = this.notifications.manager;
    const comment = await manager.findOne(Comment, {
      where: { id: notification.commentId },
    });
    if (
      !comment ||
      !parseCommentMentions(comment.body).memberIds.has(
        notification.memberId.toLowerCase()
      )
    )
      return null;
    const member = await manager.findOne(TeamMember, {
      where: {
        id: notification.memberId,
        projectId: notification.payload.projectId,
        userId: notification.recipientUserId,
        isActive: true,
      },
    });
    if (!member) return null;
    const ticket = await manager.findOne(Ticket, {
      where: {
        id: notification.payload.ticketId,
        projectId: notification.payload.projectId,
      },
      relations: ['project'],
    });
    if (ticket?.project?.workspaceId !== notification.payload.workspaceId)
      return null;
    const [user, memberships, author] = await Promise.all([
      this.userRequest(
        `/users/${encodeURIComponent(notification.recipientUserId)}`
      ),
      this.userRequest(
        `/workspaces/${encodeURIComponent(
          notification.payload.workspaceId
        )}/members`
      ),
      this.userRequest(`/users/${encodeURIComponent(comment.authorId)}`),
    ]);
    if (!user || !Array.isArray(memberships)) return null;
    const account = user as { email?: string; name?: string; roles?: string[] };
    if (!account.roles?.some((role) => role === 'user' || role === 'admin'))
      return null;
    if (
      !account.roles.includes('admin') &&
      !memberships.some((m) => m.userId === notification.recipientUserId)
    )
      return null;
    if (!account.email || !isEmail(account.email)) return null;
    if (notification.deliveryPayload) {
      // A retried send must have identical content; never send to an account's old email.
      return notification.deliveryPayload.to[0] === account.email
        ? notification.deliveryPayload
        : null;
    }
    const payload = {
      ...notification.payload,
      to: [account.email],
      recipientName: (account.name || member.name).slice(0, 255),
      authorName: (
        (author as { name?: string } | null)?.name ||
        notification.payload.authorName
      )
        .replace(/[\r\n]/g, ' ')
        .slice(0, 255),
    };
    await this.notifications.update(notification.id, {
      deliveryPayload: payload,
    });
    return payload;
  }

  private async userRequest(path: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl('USER_API_URL')}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new DeliveryError('user_api_unavailable', true);
    return response.json();
  }

  private baseUrl(variable: string) {
    const value = process.env[variable];
    if (!value)
      throw new DeliveryError('notification_configuration_missing', false);
    const url = new URL(value);
    if (url.pathname === '/' || url.pathname === '') url.pathname = '/api';
    return url.toString().replace(/\/$/, '');
  }

  private finish(
    id: string,
    status: 'sent' | 'failed' | 'skipped',
    code: string
  ) {
    return this.notifications.update(id, {
      status,
      lastCode: code,
      lockedUntil: null,
    });
  }
}
