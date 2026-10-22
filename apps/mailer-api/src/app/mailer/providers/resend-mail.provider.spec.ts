import { testConfig } from '../../test-config';
import { MailMessage } from '../mail-provider';
import { MailerConfig } from '../mailer.config';
import { ResendMailProvider } from './resend-mail.provider';

describe('ResendMailProvider', () => {
  const config = new MailerConfig(
    testConfig({
      MAILER_PROVIDER: 'resend',
      MAILER_SERVICE_TOKEN: 'a'.repeat(32),
      MAILER_FROM_EMAIL: 'sender@example.com',
      RESEND_API_KEY: 'resend-test-key',
    })
  );
  const provider = new ResendMailProvider(config);
  const message: MailMessage = {
    from: config.from,
    to: ['recipient@example.com'],
    subject: 'Welcome',
    text: 'Hello',
    replyTo: 'reply@example.com',
    idempotencyKey: 'welcome/user-1',
  };
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the generic contract to Resend and forwards idempotency', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend-id' }))
    );
    expect(await provider.send(message)).toEqual({
      id: 'resend-id',
      provider: 'resend',
      status: 'accepted',
    });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(request.headers).toMatchObject({
      Authorization: 'Bearer resend-test-key',
      'Idempotency-Key': message.idempotencyKey,
    });
    expect(JSON.parse(request.body)).toEqual({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      reply_to: message.replyTo,
    });
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [429, 'rate_limit_exceeded', 429, 'provider_rate_limited', true],
    [429, 'daily_quota_exceeded', 429, 'daily_quota_exceeded', false],
    [429, 'monthly_quota_exceeded', 429, 'monthly_quota_exceeded', false],
    [409, 'invalid_idempotent_request', 409, 'idempotency_conflict', false],
    [409, 'concurrent_idempotent_requests', 409, 'request_in_progress', true],
    [422, 'validation_error', 422, 'provider_rejected_message', false],
    [401, 'invalid_api_key', 503, 'provider_configuration_error', false],
    [403, 'validation_error', 503, 'provider_configuration_error', false],
    [500, 'application_error', 502, 'provider_error', true],
  ])(
    'normalizes upstream %s/%s without exposing its body',
    async (status, name, expected, code, retryable) => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({ name, message: 'sensitive upstream details' }),
          { status: Number(status) }
        )
      );
      await expect(provider.send(message)).rejects.toMatchObject({
        status: expected,
        code,
        retryable,
        message: code,
      });
    }
  );

  it('preserves retry-after on throttling', async () => {
    fetchMock.mockResolvedValue(
      new Response('{}', { status: 429, headers: { 'retry-after': '5' } })
    );
    await expect(provider.send(message)).rejects.toMatchObject({
      retryAfterSeconds: 5,
    });
  });

  it('normalizes a network failure', async () => {
    fetchMock.mockRejectedValue(new Error('credentials must not escape'));
    await expect(provider.send(message)).rejects.toMatchObject({
      status: 503,
      code: 'provider_unavailable',
      retryable: true,
    });
  });

  it('normalizes a timeout including an uncertain send outcome', async () => {
    const controller = new AbortController();
    controller.abort();
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    fetchMock.mockRejectedValue(new Error('abort'));
    await expect(provider.send(message)).rejects.toMatchObject({
      status: 504,
      code: 'provider_timeout',
      retryable: true,
    });
  });

  it.each(['{}', 'invalid JSON'])(
    'rejects malformed successful responses',
    async (body) => {
      fetchMock.mockResolvedValue(new Response(body));
      await expect(provider.send(message)).rejects.toMatchObject({
        status: 502,
        code: 'provider_invalid_response',
      });
    }
  );
});
