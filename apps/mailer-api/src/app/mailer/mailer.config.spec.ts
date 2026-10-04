import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { testConfig } from '../test-config';
import { MAIL_PROVIDER } from './mail-provider';
import { MailerConfig } from './mailer.config';
import { MailerModule } from './mailer.module';

describe('Mailer configuration and provider selection', () => {
  const valid = {
    NODE_ENV: 'test',
    MAILER_PROVIDER: 'noop',
    MAILER_SERVICE_TOKEN: 'a'.repeat(32),
    MAILER_FROM_EMAIL: 'sender@example.com',
  };
  it.each([
    { MAILER_SERVICE_TOKEN: '' },
    { MAILER_SERVICE_TOKEN: 'short' },
    { MAILER_SERVICE_TOKEN: 'a'.repeat(32) + '\n' },
    { MAILER_PROVIDER: 'unknown' },
    { NODE_ENV: 'production' },
    { MAILER_PROVIDER: 'resend', RESEND_API_KEY: '' },
    { MAILER_PROVIDER: 'resend', RESEND_API_KEY: 'resend-key\n' },
    { MAILER_FROM_EMAIL: 'invalid' },
    { MAILER_FROM_NAME: 'name\r\nheader' },
    { MAILER_TIMEOUT_MS: 'NaN' },
    { MAILER_API_PORT: '0' },
  ])('fails closed for invalid configuration', (overrides) => {
    expect(
      () => new MailerConfig(testConfig({ ...valid, ...overrides }))
    ).toThrow();
  });

  it('resolves the noop provider through Nest DI without a Resend key', async () => {
    const module = await Test.createTestingModule({
      imports: [MailerModule],
      providers: [{ provide: ConfigService, useValue: testConfig(valid) }],
    })
      .overrideProvider(MailerConfig)
      .useValue(new MailerConfig(testConfig(valid)))
      .compile();
    const provider = module.get(MAIL_PROVIDER);
    const result = await provider.send({
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Test',
      text: 'Hello',
      idempotencyKey: 'test/1',
    });
    expect(result).toMatchObject({ provider: 'noop', status: 'simulated' });
    await module.close();
  });
});
