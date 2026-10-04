import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  MAIL_PROVIDER,
  MailProvider,
  MailProviderError,
} from './mail-provider';
import { MailerConfig } from './mailer.config';
import { SendEmailDto } from './send-email.dto';

@Injectable()
export class MailerService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: MailProvider,
    private readonly config: MailerConfig
  ) {}

  async send(dto: SendEmailDto, idempotencyKey: string | undefined) {
    if (
      !idempotencyKey ||
      idempotencyKey.length > 256 ||
      /[^\x21-\x7e]/.test(idempotencyKey)
    ) {
      throw new BadRequestException(
        'Idempotency-Key must contain 1 to 256 printable characters without spaces'
      );
    }
    if (!dto.html?.trim() && !dto.text?.trim()) {
      throw new BadRequestException('At least one of html or text is required');
    }
    if (dto.to.length + (dto.cc?.length || 0) + (dto.bcc?.length || 0) > 50) {
      throw new BadRequestException(
        'A message can have at most 50 recipients across to, cc and bcc'
      );
    }
    try {
      return await this.provider.send({
        ...dto,
        from: this.config.from,
        idempotencyKey,
      });
    } catch (error) {
      if (!(error instanceof MailProviderError)) throw error;
      throw new HttpException(
        {
          statusCode: error.status,
          message: 'The mail provider could not accept the message',
          code: error.code,
          retryable: error.retryable,
          ...(error.retryAfterSeconds !== undefined
            ? { retryAfterSeconds: error.retryAfterSeconds }
            : {}),
        },
        error.status
      );
    }
  }
}
