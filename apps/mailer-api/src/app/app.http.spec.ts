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
});
