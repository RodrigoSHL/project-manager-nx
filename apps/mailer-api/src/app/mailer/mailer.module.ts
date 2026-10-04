import { Module } from '@nestjs/common';
import { MAIL_PROVIDER } from './mail-provider';
import { MailerConfig } from './mailer.config';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';
import { NoopMailProvider } from './providers/noop-mail.provider';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { ServiceTokenGuard } from './service-token.guard';

@Module({
  controllers: [MailerController],
  providers: [
    MailerConfig,
    ServiceTokenGuard,
    {
      provide: MAIL_PROVIDER,
      inject: [MailerConfig],
      useFactory: (config: MailerConfig) =>
        config.provider === 'noop'
          ? new NoopMailProvider()
          : new ResendMailProvider(config),
    },
    MailerService,
  ],
  exports: [MailerService, MailerConfig],
})
export class MailerModule {}
