import { Injectable } from '@nestjs/common';
import {
  MailMessage,
  MailProvider,
  MailProviderError,
  MailResult,
} from '../mail-provider';
import { MailerConfig } from '../mailer.config';

@Injectable()
export class ResendMailProvider implements MailProvider {
  constructor(private readonly config: MailerConfig) {}

  async send(message: MailMessage): Promise<MailResult> {
    const signal = AbortSignal.timeout(this.config.timeoutMs);
    let response: Response;
    let body: unknown;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${this.config.resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          cc: message.cc,
          bcc: message.bcc,
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      body = await response.json().catch(() => undefined);
      if (signal.aborted) throw new Error('timeout');
    } catch {
      throw new MailProviderError(
        signal.aborted ? 504 : 503,
        signal.aborted ? 'provider_timeout' : 'provider_unavailable',
        true
      );
    }

    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    if (!response.ok) {
      if (response.status === 429) {
        const quota =
          data.name === 'daily_quota_exceeded' ||
          data.name === 'monthly_quota_exceeded';
        const retryAfter = response.headers.get('retry-after');
        const seconds =
          retryAfter && /^\d+$/.test(retryAfter)
            ? Number(retryAfter)
            : undefined;
        throw new MailProviderError(
          429,
          quota ? String(data.name) : 'provider_rate_limited',
          !quota,
          seconds
        );
      }
      if (response.status === 409) {
        const concurrent = data.name === 'concurrent_idempotent_requests';
        throw new MailProviderError(
          409,
          concurrent ? 'request_in_progress' : 'idempotency_conflict',
          concurrent
        );
      }
      if ([400, 422].includes(response.status)) {
        throw new MailProviderError(422, 'provider_rejected_message', false);
      }
      if ([401, 403].includes(response.status)) {
        throw new MailProviderError(503, 'provider_configuration_error', false);
      }
      throw new MailProviderError(
        502,
        'provider_error',
        response.status >= 500
      );
    }
    if (typeof data.id !== 'string' || !data.id) {
      throw new MailProviderError(502, 'provider_invalid_response', true);
    }
    return { id: data.id, provider: 'resend', status: 'accepted' };
  }
}
