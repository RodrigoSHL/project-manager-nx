import { randomUUID } from 'node:crypto';
import { MailProvider, MailResult } from '../mail-provider';

// Does not log or retain recipients, credentials, or message content.
export class NoopMailProvider implements MailProvider {
  async send(): Promise<MailResult> {
    return { id: randomUUID(), provider: 'noop', status: 'simulated' };
  }
}
