import { EntityManager, Repository } from 'typeorm';
import { CommentMentionNotificationsService } from './comment-mention-notifications.service';
import {
  CommentMentionNotification,
  MentionEmailPayload,
} from './entities/comment-mention-notification.entity';
import { Comment } from './entities/comment.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { parseCommentMentions } from './comment-mentions';

const memberId = '00000000-0000-4000-8000-000000000001';
const token = `@{member:${memberId}:Sebasti%C3%A1n}`;
const payload: MentionEmailPayload = {
  to: ['stale@example.com'],
  recipientName: 'Sebastián',
  authorName: 'Autora',
  projectName: 'Project',
  ticketKey: 'PM-1',
  ticketTitle: 'Title',
  commentText: '@Sebastián revisa esto',
  workspaceId: 'workspace',
  projectId: 'project',
  ticketId: 'ticket',
  commentId: 'comment',
};

describe('mention notification queue', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const query = jest.fn();
  const update = jest.fn();
  const manager = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const builder = {
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    execute: jest.fn(),
  };
  const repository = { query, update, manager };
  let service: CommentMentionNotificationsService;
  let notification: CommentMentionNotification;
  let memberships: unknown[];
  let active: boolean;
  let body: string;
  let mailStatus: number;
  let mailResult: unknown;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JIRA_MENTION_EMAILS_ENABLED = 'true';
    process.env.MAILER_API_URL = 'http://mailer-api:3006/api';
    process.env.USER_API_URL = 'http://user-api:3001';
    process.env.MAILER_SERVICE_TOKEN = 'unit-test-token';
    service = new CommentMentionNotificationsService(
      repository as unknown as Repository<CommentMentionNotification>
    );
    notification = {
      id: 'notification',
      commentId: 'comment',
      memberId,
      recipientUserId: 'recipient',
      payload,
      attempts: 1,
      deliveryPayload: null,
    } as CommentMentionNotification;
    query.mockImplementation(async () =>
      query.mock.calls.length === 1 ? [] : [notification]
    );
    update.mockResolvedValue({ affected: 1 });
    for (const name of ['insert', 'into', 'values', 'orIgnore'] as const)
      builder[name].mockReturnValue(builder);
    builder.execute.mockResolvedValue(undefined);
    manager.createQueryBuilder.mockReturnValue(builder);
    memberships = [{ userId: 'recipient' }];
    active = true;
    body = token;
    manager.findOne.mockImplementation(async (entity) => {
      if (entity === Comment) return { body, authorId: 'author' };
      if (entity === TeamMember)
        return active
          ? {
              id: memberId,
              userId: 'recipient',
              name: 'Sebastián',
              email: 'stale@example.com',
            }
          : null;
      if (entity === Ticket)
        return {
          id: 'ticket',
          projectId: 'project',
          key: 'PM-1',
          title: 'Title',
          project: { name: 'Project', workspaceId: 'workspace' },
        };
      return null;
    });
    manager.find.mockResolvedValue([
      {
        id: memberId,
        userId: 'recipient',
        name: 'Sebastián',
        email: 'stale@example.com',
      },
    ]);
    mailStatus = 200;
    mailResult = { status: 'accepted' };
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/workspaces/')) return Response.json(memberships);
      if (url.endsWith('/users/recipient'))
        return Response.json({
          name: 'Perfil actual',
          email: 'current@example.com',
          roles: ['user'],
        });
      if (url.endsWith('/users/author'))
        return Response.json({ name: 'Autora real' });
      if (url.endsWith('/emails/templates/jira-comment-mention'))
        return Response.json(mailResult, { status: mailStatus });
      throw new Error('Unexpected URL');
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it('decodes persisted mentions, deduplicates IDs and leaves malformed tokens alone', () => {
    const parsed = parseCommentMentions(
      `${token} ${token} @Sebastián @{member:${memberId}:%ZZ}`
    );
    expect([...parsed.memberIds]).toEqual([memberId]);
    expect(parsed.text).toBe(
      `@Sebastián @Sebastián @Sebastián @{member:${memberId}:%ZZ}`
    );
    expect(parseCommentMentions('@Sebastián').memberIds.size).toBe(0);
  });

  it('queues an eligible mention with readable text and a unique recipient constraint', async () => {
    await service.enqueue(
      manager as unknown as EntityManager,
      {
        id: 'comment',
        ticketId: 'ticket',
        authorId: 'author',
        body: token,
      } as Comment
    );
    expect(manager.find).toHaveBeenCalledWith(
      TeamMember,
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: 'project',
          isActive: true,
        }),
      })
    );
    expect(builder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'recipient',
        payload: expect.objectContaining({ commentText: '@Sebastián' }),
      })
    );
    expect(builder.orIgnore).toHaveBeenCalled();
  });

  it('ignores unchanged mentions, self mentions and members without accounts', async () => {
    const comment = {
      id: 'comment',
      ticketId: 'ticket',
      authorId: 'author',
      body: token,
    } as Comment;
    await service.enqueue(manager as unknown as EntityManager, comment, token);
    expect(builder.values).not.toHaveBeenCalled();
    manager.find.mockResolvedValue([
      { id: memberId, userId: 'author' },
      { id: memberId, userId: null },
    ]);
    await service.enqueue(manager as unknown as EntityManager, comment);
    expect(builder.values).not.toHaveBeenCalled();
  });

  it('does no DB or HTTP work when notifications are disabled', async () => {
    process.env.JIRA_MENTION_EMAILS_ENABLED = 'false';
    await service.enqueue(
      manager as unknown as EntityManager,
      { body: token } as Comment
    );
    await service.processNext();
    expect(manager.findOne).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends using the current account email, a frozen payload and a stable idempotency key', async () => {
    await service.processNext();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://user-api:3001/api/users/recipient',
      expect.anything()
    );
    const call = fetchMock.mock.calls.find(([url]) => url.includes('/emails/'));
    expect(call?.[1].headers['Idempotency-Key']).toBe(
      'jira-mention/comment/recipient'
    );
    expect(JSON.parse(call?.[1].body)).toMatchObject({
      to: ['current@example.com'],
      authorName: 'Autora real',
      recipientName: 'Perfil actual',
    });
    expect(update).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ deliveryPayload: expect.anything() })
    );
    expect(update).toHaveBeenLastCalledWith('notification', {
      status: 'sent',
      lastCode: 'accepted',
      lockedUntil: null,
    });
  });

  it.each([
    'removed-mention',
    'inactive-member',
    'removed-workspace',
    'changed-email',
  ])('skips a recipient who is no longer eligible (%s)', async (reason) => {
    if (reason === 'removed-mention') body = 'Mención eliminada';
    if (reason === 'inactive-member') active = false;
    if (reason === 'removed-workspace') memberships = [];
    if (reason === 'changed-email') notification.deliveryPayload = payload;
    await service.processNext();
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/emails/'))).toBe(
      false
    );
    expect(update).toHaveBeenLastCalledWith(
      'notification',
      expect.objectContaining({ status: 'skipped' })
    );
  });

  it('retries provider failures without changing the already frozen message', async () => {
    notification.deliveryPayload = { ...payload, to: ['current@example.com'] };
    mailStatus = 503;
    mailResult = { code: 'provider_unavailable', retryable: true };
    await service.processNext();
    const call = fetchMock.mock.calls.find(([url]) => url.includes('/emails/'));
    expect(JSON.parse(call?.[1].body)).toEqual(notification.deliveryPayload);
    expect(update).toHaveBeenLastCalledWith(
      'notification',
      expect.objectContaining({
        status: 'pending',
        nextAttemptAt: expect.any(Date),
        lastCode: 'provider_unavailable',
      })
    );
  });

  it('stops retrying a permanent failure', async () => {
    mailStatus = 422;
    mailResult = { code: 'provider_validation_error', retryable: false };
    await service.processNext();
    expect(update).toHaveBeenLastCalledWith(
      'notification',
      expect.objectContaining({
        status: 'failed',
        lastCode: 'provider_validation_error',
      })
    );
  });
});
