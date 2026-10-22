import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SendEmailDto } from './send-email.dto';
import { ServiceTokenGuard } from './service-token.guard';
import { MailerConfig } from './mailer.config';
import { JiraCommentMentionDto } from './templates/jira-comment-mention.dto';
import { renderJiraCommentMention } from './templates/jira-comment-mention.template';

@Controller('emails')
@UseGuards(ServiceTokenGuard)
export class MailerController {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: MailerConfig
  ) {}

  @Post('templates/jira-comment-mention')
  @HttpCode(200)
  sendMention(
    @Body() dto: JiraCommentMentionDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const rendered = renderJiraCommentMention(dto, this.config.jiraWebUrl);
    return this.mailer.send({ to: dto.to, ...rendered }, idempotencyKey);
  }

  @Post()
  @HttpCode(200)
  send(
    @Body() dto: SendEmailDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    return this.mailer.send(dto, idempotencyKey);
  }
}
