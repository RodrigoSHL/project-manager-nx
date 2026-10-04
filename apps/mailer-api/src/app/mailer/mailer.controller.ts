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

@Controller('emails')
@UseGuards(ServiceTokenGuard)
export class MailerController {
  constructor(private readonly mailer: MailerService) {}

  @Post()
  @HttpCode(200)
  send(
    @Body() dto: SendEmailDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    return this.mailer.send(dto, idempotencyKey);
  }
}
