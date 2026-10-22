export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

export interface MailMessage {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  idempotencyKey: string;
}

export interface MailResult {
  id: string;
  provider: string;
  status: 'accepted' | 'simulated';
}

export interface MailProvider {
  send(message: MailMessage): Promise<MailResult>;
}

export class MailProviderError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
    readonly retryAfterSeconds?: number
  ) {
    super(code);
  }
}
