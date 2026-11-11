import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProjectAccessService } from '../project-api/project-access.service';
import { JiraNotificationsController } from './jira-notifications.controller';
import { NotificationApiClient } from './notification-api.client';

describe('Jira notification access', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const projectId = '00000000-0000-4000-8000-000000000002';
  const notificationId = '00000000-0000-4000-8000-000000000003';
  const revokedId = '00000000-0000-4000-8000-000000000004';
  const secret = 'unit-test-jira-notification-jwt';
  const http = global.fetch;
  const findAccessibleProjects = jest.fn();
  const findAccessibleProject = jest.fn();
  const upstream = jest.fn();
  let app: INestApplication;
  let base: string;
  let jwt: JwtService;
  const env = { ...process.env };
  const path = '/api/jira/notifications';

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    process.env.NOTIFICATION_API_URL = 'http://notification-api:3008/api';
    process.env.NOTIFICATION_SERVICE_TOKEN = 'unit-test-notification-token';
    jwt = new JwtService({ secret });
    const module = await Test.createTestingModule({
      controllers: [JiraNotificationsController],
      providers: [
        JwtStrategy,
        RolesGuard,
        NotificationApiClient,
        {
          provide: ProjectAccessService,
          useValue: { findAccessibleProjects, findAccessibleProject },
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = upstream;
    findAccessibleProjects.mockResolvedValue([
      { id: projectId, teamMembers: [{ userId, isActive: true }] },
      { id: revokedId, teamMembers: [{ userId, isActive: false }] },
    ]);
    findAccessibleProject.mockResolvedValue({
      id: projectId,
      teamMembers: [{ userId, isActive: true }],
    });
  });

  afterAll(async () => {
    global.fetch = http;
    process.env = env;
    await app?.close();
  });

  const request = (
    suffix = '',
    method = 'GET',
    roles: string[] | null = ['user']
  ) =>
    http(`${base}${path}${suffix}`, {
      method,
      headers: roles
        ? { Authorization: `Bearer ${jwt.sign({ sub: userId, roles })}` }
        : {},
    });

  it('requires a Jira session and rejects an arbitrary recipient filter', async () => {
    expect((await request('', 'GET', null)).status).toBe(401);
    expect((await request('', 'GET', [])).status).toBe(403);
    expect((await request('?recipientId=other')).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('scopes history to the JWT recipient and current project memberships', async () => {
    upstream.mockResolvedValueOnce(
      Response.json({
        items: [
          {
            id: notificationId,
            projectId,
            metadata: { projectName: 'Example', privateField: 'hidden' },
            recipientId: userId,
          },
        ],
        page: 1,
        limit: 6,
        total: 1,
        unreadCount: 1,
      })
    );
    const response = await request('?limit=6&status=unread');
    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe('http://notification-api:3008/api/notifications/inbox');
    expect(JSON.parse(init.body)).toEqual({
      application: 'jira',
      recipientId: userId,
      projectIds: [projectId],
      page: 1,
      limit: 6,
      status: 'unread',
    });
    const body = await response.json();
    expect(body.items[0]).toEqual({
      id: notificationId,
      projectId,
      projectName: 'Example',
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('checks project access before updating and scopes the update to the JWT recipient', async () => {
    findAccessibleProject.mockRejectedValueOnce(new ForbiddenException());
    expect(
      (await request(`/${revokedId}/${notificationId}/read`, 'PATCH')).status
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    upstream.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(
      (await request(`/${projectId}/${notificationId}/read`, 'PATCH')).status
    ).toBe(404);
    const url = new URL(upstream.mock.calls[0][0]);
    expect(url.searchParams.get('recipientId')).toBe(userId);
    expect(url.searchParams.get('projectId')).toBe(projectId);
    expect(url.searchParams.get('application')).toBe('jira');
  });
});
