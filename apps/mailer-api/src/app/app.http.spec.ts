import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { MAIL_PROVIDER, MailProviderError } from './mailer/mail-provider';
import { testConfig } from './test-config';

describe('Mailer HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;
  const token = 'mailer-test-token-at-least-32-characters';
  const send = jest.fn();
  const message = {
    to: ['recipient@example.com'],
    subject: 'Welcome',
    text: 'Hello',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        testConfig({
          NODE_ENV: 'test',
          MAILER_PROVIDER: 'noop',
          MAILER_SERVICE_TOKEN: token,
          MAILER_FROM_EMAIL: 'sender@example.com',
          MAILER_FROM_NAME: 'Project Manager',
          API_PREFIX: 'api',
          JIRA_WEB_URL: 'https://jira.atomdev.cl',
        })
      )
      .overrideProvider(MAIL_PROVIDER)
      .useValue({ send })
      .compile();
    app = module.createNestApplication({ bodyParser: false, logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    send.mockReset().mockResolvedValue({
      id: 'email-1',
      provider: 'resend',
      status: 'accepted',
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  function post(
    body: unknown,
    auth = `Bearer ${token}`,
    key: string | undefined = 'welcome/user-1'
  ) {
    return fetch(`${baseUrl}/api/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        ...(key === undefined ? {} : { 'Idempotency-Key': key }),
      },
      body: JSON.stringify(body),
    });
  }

  it('exposes a public health check', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'mailer-api',
    });
  });

  it.each(['', 'Bearer wrong', `Basic ${token}`])(
    'rejects unauthorized sends (%s)',
    async (auth) => {
      expect((await post(message, auth)).status).toBe(401);
      expect(send).not.toHaveBeenCalled();
    }
  );

  it('sends through the injected provider with the configured sender', async () => {
    const body = {
      ...message,
      html: '<p>Hello</p>',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      replyTo: 'reply@example.com',
    };
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'email-1',
      provider: 'resend',
      status: 'accepted',
    });
    expect(send).toHaveBeenCalledWith({
      ...body,
      from: 'Project Manager <sender@example.com>',
      idempotencyKey: 'welcome/user-1',
    });
  });

  it.each([
    { ...message, to: [] },
    { ...message, to: ['invalid'] },
    { ...message, subject: ' ' },
    { ...message, subject: 'header\r\ninjection' },
    { ...message, subject: 'trailing newline\n' },
    { ...message, text: undefined },
    { ...message, text: ' ' },
    { ...message, html: null },
    { ...message, cc: null },
    { ...message, from: 'override@example.com' },
    { ...message, provider: 'smtp' },
    {
      ...message,
      to: Array(50).fill('to@example.com'),
      cc: ['cc@example.com'],
    },
    { ...message, text: 'x'.repeat(250001) },
  ])(
    'rejects an invalid message before contacting the provider',
    async (body) => {
      expect((await post(body)).status).toBe(400);
      expect(send).not.toHaveBeenCalled();
    }
  );

  it.each(['', 'spaces not allowed', 'x'.repeat(257)])(
    'rejects invalid idempotency keys',
    async (key) => {
      expect((await post(message, `Bearer ${token}`, key)).status).toBe(400);
      expect(send).not.toHaveBeenCalled();
    }
  );

  it('requires an idempotency key', async () => {
    const response = await fetch(`${baseUrl}/api/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    });
    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('bounds the HTTP body size', async () => {
    expect((await post({ ...message, text: 'x'.repeat(1048576) })).status).toBe(
      413
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('returns normalized provider errors with retry guidance', async () => {
    send.mockRejectedValue(
      new MailProviderError(429, 'provider_rate_limited', true, 5)
    );
    const response = await post(message);
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      code: 'provider_rate_limited',
      retryable: true,
      retryAfterSeconds: 5,
    });
  });

  const id = '00000000-0000-4000-8000-000000000001';
  const mention = {
    to: ['recipient@example.com'],
    recipientName: 'Sebastián',
    authorName: 'Carolina',
    projectName: 'Project Manager',
    ticketKey: 'PM-142',
    ticketTitle: 'Revisar integración',
    commentText: 'Hola @Sebastián',
    workspaceId: id,
    projectId: id,
    ticketId: id,
    commentId: id,
  };
  function postMention(
    body: unknown,
    auth = `Bearer ${token}`,
    key = 'jira-mention/comment/recipient'
  ) {
    return fetch(`${baseUrl}/api/emails/templates/jira-comment-mention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        'Idempotency-Key': key,
      },
      body: JSON.stringify(body),
    });
  }

  it('renders the mention template through the same injected mail provider', async () => {
    const response = await postMention(mention);
    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mention.to,
        from: 'Project Manager <sender@example.com>',
        idempotencyKey: 'jira-mention/comment/recipient',
        subject: '[PM-142] Carolina te mencionó en un comentario',
        html: expect.stringContaining('Ver comentario'),
        text: expect.stringContaining('https://jira.atomdev.cl/'),
      })
    );
  });

  it.each([
    { ...mention, to: ['a@example.com', 'b@example.com'] },
    { ...mention, commentId: 'bad' },
    { ...mention, authorName: 'Header\n' },
    { ...mention, ticketKey: 'PM-1\n' },
    { ...mention, commentText: '' },
    { ...mention, commentText: 'x'.repeat(6001) },
    { ...mention, ticketUrl: 'https://evil.example' },
  ])('rejects malformed mention template inputs', async (body) => {
    expect((await postMention(body)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('protects templates with the service token and required idempotency', async () => {
    expect((await postMention(mention, 'Bearer wrong')).status).toBe(401);
    expect((await postMention(mention, `Bearer ${token}`, '')).status).toBe(
      400
    );
    expect(send).not.toHaveBeenCalled();
  });
});
