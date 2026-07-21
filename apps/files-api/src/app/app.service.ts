import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return { message: 'Files API' };
  }

  health() {
    return {
      status: 'ok',
      service: 'files-api',
      storageProvider: process.env.FILES_STORAGE_DRIVER || 'database',
    };
  }
}
