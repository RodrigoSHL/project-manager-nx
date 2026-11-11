import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationConfig {
  readonly serviceToken: string;
  readonly port: number;

  constructor(config: ConfigService) {
    this.serviceToken = config.get<string>('NOTIFICATION_SERVICE_TOKEN') || '';
    if (
      this.serviceToken.length < 32 ||
      this.serviceToken.length > 256 ||
      /[^\x21-\x7e]/.test(this.serviceToken)
    ) {
      throw new Error(
        'NOTIFICATION_SERVICE_TOKEN must contain 32 to 256 printable characters without spaces'
      );
    }
    this.port = Number(
      config.get('NOTIFICATION_API_PORT') || config.get('PORT') || 3008
    );
    if (!Number.isInteger(this.port) || this.port < 1 || this.port > 65535) {
      throw new Error(
        'NOTIFICATION_API_PORT must be an integer between 1 and 65535'
      );
    }
  }
}
