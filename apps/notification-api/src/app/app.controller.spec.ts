import { testConfig } from './test-config';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configureApp } from './configure-app';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';

const token = 'notification-test-token-at-least-32-characters';
const scope = {
  application: 'jira',
  projectId: 'project-1',
  recipientId: 'user-1',
};
const message = {
  ...scope,
  title: 'Nueva mención',
  body: 'Te mencionaron en PM-1',
};

describe('Notification HTTP API', () => {
  let app: INestApplication;
  let url: string;
  const repository = {
    create: jest.fn((dto) => dto),
    save: jest.fn(),
    findAndCount: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    findOneBy: jest.fn(),
  };
  const database = { query: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [NotificationsModule],
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: testConfig({
            NOTIFICATION_SERVICE_TOKEN: token,
            API_PREFIX: 'api',
          }),
        },
        { provide: DataSource, useValue: database },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(
        testConfig({
          NOTIFICATION_SERVICE_TOKEN: token,
          API_PREFIX: 'api',
        })
      )
      .overrideProvider(getRepositoryToken(Notification))
      .useValue(repository)
      .compile();
    app = module.createNestApplication({ bodyParser: false, logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    database.query.mockResolvedValue([{ '?column?': 1 }]);
    repository.save.mockImplementation(async (value) => ({
      ...value,
      id: '00000000-0000-4000-8000-000000000001',
    }));
    repository.findAndCount.mockResolvedValue([[], 0]);
    repository.countBy.mockResolvedValue(0);
  });
  afterAll(async () => {
    await app?.close();
  });
  const request = (
    path: string,
    method = 'GET',
    body?: unknown,
    auth = `Bearer ${token}`
  ) =>
    fetch(`${url}/api/${path}`, {
      method,
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  it('checks PostgreSQL in its unauthenticated health endpoint', async () => {
    const response = await request('health', 'GET', undefined, '');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'notification-api',
    });
    database.query.mockRejectedValueOnce(new Error('connection refused'));
    expect((await request('health')).status).toBe(503);
  });

  it.each(['', 'Bearer invalid', `Basic ${token}`])(
    'rejects invalid service credentials: %s',
    async (auth) => {
      expect(
        (await request('notifications', 'POST', message, auth)).status
      ).toBe(401);
      expect(repository.save).not.toHaveBeenCalled();
    }
  );

  it('creates a notification with safe server defaults', async () => {
    const response = await request('notifications', 'POST', message);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      ...message,
      type: 'info',
      metadata: {},
      readAt: null,
      eventKey: null,
    });
  });

  it.each([
    { ...message, application: '' },
    { ...message, projectId: null },
    { ...message, recipientId: ' ' },
    { ...message, title: ' ' },
    { ...message, body: '' },
    { ...message, title: 'x'.repeat(201) },
    { ...message, body: 'x'.repeat(10001) },
    { ...message, metadata: [] },
    { ...message, metadata: null },
    { ...message, type: null },
    { ...message, eventKey: '' },
    { ...message, eventKey: null },
    { ...message, readAt: '2026-11-10' },
    { ...message, id: 'chosen-id' },
  ])('rejects invalid creation data', async (body) => {
    expect((await request('notifications', 'POST', body)).status).toBe(400);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('requires the full scope for all reads and updates', async () => {
    for (const path of [
      'notifications',
      'notifications/unread-count',
      'notifications/00000000-0000-4000-8000-000000000001/read',
    ]) {
      expect(
        (await request(path, path.endsWith('/read') ? 'PATCH' : 'GET')).status
      ).toBe(400);
    }
    expect(repository.findAndCount).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validates pagination and unread filters', async () => {
    const query = new URLSearchParams(scope);
    expect((await request(`notifications?${query}&limit=101`)).status).toBe(
      400
    );
    expect((await request(`notifications?${query}&page=0`)).status).toBe(400);
    expect(
      (await request(`notifications?${query}&status=invalid`)).status
    ).toBe(400);
    const response = await request(
      `notifications?${query}&limit=10&status=unread`
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  it('bounds incoming JSON before persistence', async () => {
    expect(
      (
        await request('notifications', 'POST', {
          ...message,
          metadata: { value: 'x'.repeat(262144) },
        })
      ).status
    ).toBe(413);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
