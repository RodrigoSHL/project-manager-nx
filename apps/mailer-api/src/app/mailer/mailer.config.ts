import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';

@Injectable()
export class MailerConfig {
  readonly provider: string;
  readonly serviceToken: string;
  readonly from: string;
  readonly resendApiKey: string;
  readonly timeoutMs: number;
  readonly port: number;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('MAILER_PROVIDER') || 'resend';
    if (!['resend', 'noop'].includes(this.provider)) {
      throw new Error('MAILER_PROVIDER must be resend or noop');
    }
    if (this.provider === 'noop' && config.get('NODE_ENV') === 'production') {
      throw new Error(
        'The noop mail provider is only available outside production'
      );
    }
    this.serviceToken = config.get<string>('MAILER_SERVICE_TOKEN') || '';
    if (
      this.serviceToken.length < 32 ||
      this.serviceToken.length > 256 ||
      /[^\x21-\x7e]/.test(this.serviceToken)
    ) {
      throw new Error(
        'MAILER_SERVICE_TOKEN must contain 32 to 256 printable characters without spaces'
      );
    }
    const email = config.get<string>('MAILER_FROM_EMAIL') || '';
    const name = config.get<string>('MAILER_FROM_NAME') || '';
    if (!isEmail(email) || /[\r\n<>]/.test(name) || name.length > 100) {
      throw new Error(
        'Configure a valid MAILER_FROM_EMAIL and MAILER_FROM_NAME'
      );
    }
    this.from = name ? `${name} <${email}>` : email;
    this.resendApiKey = config.get<string>('RESEND_API_KEY') || '';
    if (
      this.provider === 'resend' &&
      (!this.resendApiKey || /\s/.test(this.resendApiKey))
    ) {
      throw new Error('RESEND_API_KEY is required for the resend provider');
    }
    this.timeoutMs = this.integer(
      config,
      'MAILER_TIMEOUT_MS',
      10000,
      100,
      60000
    );
    this.port = this.integer(
      config,
      'MAILER_API_PORT',
      Number(config.get('PORT') || 3006),
      1,
      65535
    );
  }

  private integer(
    config: ConfigService,
    key: string,
    fallback: number,
    min: number,
    max: number
  ) {
    const value = Number(config.get(key) ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}`);
    }
    return value;
  }
}
