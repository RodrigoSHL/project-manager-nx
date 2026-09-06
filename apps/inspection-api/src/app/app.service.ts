import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Inspection API' };
  }

  health(): { status: string; service: string } {
    return { status: 'ok', service: 'inspection-api' };
  }
}
