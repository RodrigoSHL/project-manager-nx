import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  health(): { status: string } {
    return { status: 'ok' };
  }
}
