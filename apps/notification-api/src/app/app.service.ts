import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  async health() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', service: 'notification-api' };
    } catch {
      throw new ServiceUnavailableException(
        'Notification database unavailable'
      );
    }
  }
}
