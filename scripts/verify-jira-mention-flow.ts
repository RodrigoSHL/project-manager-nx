import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../apps/mailer-api/src/app/app.module';
import { configureApp } from '../apps/mailer-api/src/app/configure-app';
import {
  MAIL_PROVIDER,
  MailMessage,
  MailProviderError,
} from '../apps/mailer-api/src/app/mailer/mail-provider';
import { getDatabaseConfig } from '../apps/project-api/src/app/config/database.config';
import { Project } from '../apps/project-api/src/app/projects/entities/project.entity';
import {
  TeamMember,
  TeamRole,
} from '../apps/project-api/src/app/projects/entities/team-member.entity';
import { Ticket } from '../apps/project-api/src/app/tickets/entities/ticket.entity';
import { Comment } from '../apps/project-api/src/app/comments/entities/comment.entity';
import { CommentMentionNotification } from '../apps/project-api/src/app/comments/entities/comment-mention-notification.entity';
import { CommentMentionNotificationsService } from '../apps/project-api/src/app/comments/comment-mention-notifications.service';
import { CommentsService } from '../apps/project-api/src/app/comments/comments.service';
import { AddCommentMentionNotifications1791072000000 } from '../apps/project-api/src/migrations/1791072000000-AddCommentMentionNotifications';

async function main() {
  const url = process.env.JIRA_MENTION_TEST_DATABASE_URL || '';
  const parsed = new URL(url);
  assert(
    ['localhost', '127.0.0.1'].includes(parsed.hostname) &&
      parsed.pathname === '/jira_mention_validation',
    'Use only the disposable local jira_mention_validation database'
  );
  const config = getDatabaseConfig() as DataSourceOptions & {
    entities: Function[];
  };
  const options: DataSourceOptions = {
    type: 'postgres',
    url,
    entities: config.entities,
    logging: false,
  };
  const baseline = new DataSource({
    ...options,
    entities: config.entities.filter(
      (entity) => entity !== CommentMentionNotification
    ),
    synchronize: true,
  });
  await baseline.initialize();
  const migration = new AddCommentMentionNotifications1791072000000();
  const runner = baseline.createQueryRunner();
  await migration.up(runner);
  await migration.up(runner); // Also supports a table created earlier by synchronization.
  await runner.release();
  await baseline.destroy();
  const db = await new DataSource(options).initialize();
  const authorId = randomUUID();
  const userId = randomUUID();
  const foreignUserId = randomUUID();
  const workspaceId = randomUUID();
  const calls: MailMessage[] = [];
  let failNext = false;
  const userApi = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === `/api/workspaces/${workspaceId}/members`)
      res.end(JSON.stringify([{ userId }]));
    else if (req.url?.startsWith('/api/users/'))
      res.end(
        JSON.stringify({
          name: req.url.endsWith(authorId) ? 'Carolina' : 'Sebastián',
          email: 'recipient@example.com',
          roles: ['user'],
        })
      );
    else {
      res.statusCode = 404;
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => userApi.listen(0, '127.0.0.1', resolve));
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string) =>
        ({
          NODE_ENV: 'test',
          MAILER_PROVIDER: 'noop',
          MAILER_SERVICE_TOKEN: 'validation-token-'.repeat(3),
          MAILER_FROM_EMAIL: 'sender@example.com',
          JIRA_WEB_URL: 'http://localhost:4201',
          API_PREFIX: 'api',
        }[key]),
    })
    .overrideProvider(MAIL_PROVIDER)
    .useValue({
      send: async (message: MailMessage) => {
        calls.push(message);
        if (failNext) {
          failNext = false;
          throw new MailProviderError(503, 'provider_unavailable', true);
        }
        return { id: 'simulated', provider: 'noop', status: 'simulated' };
      },
    })
    .compile();
  const mailer = module.createNestApplication({
    bodyParser: false,
    logger: false,
  });
  configureApp(mailer);
  await mailer.listen(0, '127.0.0.1');
  process.env.JIRA_MENTION_EMAILS_ENABLED = 'true';
  process.env.MAILER_API_URL = `${await mailer.getUrl()}/api`;
  process.env.USER_API_URL = `http://127.0.0.1:${
    (userApi.address() as { port: number }).port
  }/api`;
  process.env.MAILER_SERVICE_TOKEN = 'validation-token-'.repeat(3);
  try {
    const project = await db
      .getRepository(Project)
      .save({
        name: 'Validation',
        businessUnit: 'QA',
        description: 'Temporary fixture',
        workspaceId,
        key: 'VAL',
      });
    const ticket = await db
      .getRepository(Ticket)
      .save({ projectId: project.id, key: 'VAL-1', title: 'Probar menciones' });
    const members = await db.getRepository(TeamMember).save([
      {
        projectId: project.id,
        name: 'Carolina',
        email: 'author@example.com',
        userId: authorId,
        role: TeamRole.MEMBER,
      },
      {
        projectId: project.id,
        name: 'Sebastián',
        email: 'stale@example.com',
        userId,
        role: TeamRole.MEMBER,
      },
      {
        projectId: project.id,
        name: 'Sin acceso',
        email: 'foreign@example.com',
        userId: foreignUserId,
        role: TeamRole.MEMBER,
      },
    ]);
    const token = (index: number) =>
      `@{member:${members[index].id}:${encodeURIComponent(
        members[index].name
      )}}`;
    const queue = db.getRepository(CommentMentionNotification);
    const worker = new CommentMentionNotificationsService(queue);
    const replica = new CommentMentionNotificationsService(queue);
    const comments = new CommentsService(db.getRepository(Comment), worker);
    const body = `${token(1)} ${token(1)} ${token(0)} ${token(2)}`;
    const comment = await comments.create(ticket.id, { authorId, body });
    assert.equal(
      await queue.count(),
      2,
      'self mention and repeated token are omitted'
    );
    await comments.update(
      ticket.id,
      comment.id,
      { body: body + ' editado' },
      authorId
    );
    await comments.update(
      ticket.id,
      comment.id,
      { body: 'Sin menciones' },
      authorId
    );
    await comments.update(ticket.id, comment.id, { body }, authorId);
    assert.equal(
      await queue.count(),
      2,
      'edits and re-added mentions remain unique'
    );
    await Promise.all([worker.processNext(), replica.processNext()]);
    assert.equal(
      calls.length,
      1,
      'parallel replicas send only to the authorized recipient'
    );
    assert.equal(await queue.countBy({ status: 'sent' }), 1);
    assert.equal(await queue.countBy({ status: 'skipped' }), 1);
    assert.deepEqual(
      calls[0].to,
      ['recipient@example.com'],
      'uses current User API email'
    );
    assert(calls[0].html?.includes('FlowBoard'));
    assert(calls[0].text?.includes(`commentId=${comment.id}`));
    const reply = await comments.create(ticket.id, {
      authorId,
      body: token(1),
      parentCommentId: comment.id,
    });
    failNext = true;
    await worker.processNext();
    const retry = await queue.findOneByOrFail({ commentId: reply.id });
    assert.equal(retry.status, 'pending');
    assert.equal(retry.attempts, 1);
    assert(retry.deliveryPayload);
    await comments.update(
      ticket.id,
      reply.id,
      { body: `${token(1)} cambió el comentario` },
      authorId
    );
    await queue.update(retry.id, { nextAttemptAt: new Date(0) });
    await worker.processNext();
    assert.equal(
      (await queue.findOneByOrFail({ id: retry.id })).status,
      'sent'
    );
    assert.deepEqual(
      calls[1],
      calls[2],
      'retry retains identical content and idempotency key'
    );
    const obsolete = await comments.create(ticket.id, {
      authorId,
      body: token(1),
    });
    await comments.update(
      ticket.id,
      obsolete.id,
      { body: 'Mención eliminada' },
      authorId
    );
    await worker.processNext();
    assert.equal(
      (await queue.findOneByOrFail({ commentId: obsolete.id })).status,
      'skipped'
    );
    await comments.remove(ticket.id, reply.id, authorId);
    assert.equal(
      await queue.countBy({ commentId: reply.id }),
      0,
      'comment deletion cascades to notifications'
    );
    const rollback = db.createQueryRunner();
    await migration.down(rollback);
    assert.equal(
      await rollback.hasTable('comment_mention_notifications'),
      false
    );
    await rollback.release();
    console.log(
      'PASS: migration up/down, persisted queue, duplicate suppression, parallel claims, access checks, template HTTP, frozen retries, replies and cascade deletion. No real emails sent.'
    );
  } finally {
    await mailer.close();
    await new Promise<void>((resolve, reject) =>
      userApi.close((error) => (error ? reject(error) : resolve()))
    );
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
