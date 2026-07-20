import { Injectable } from '@nestjs/common';
import { DatabaseStorageProvider } from './database-storage.provider';
import { FileStorageProvider } from './storage-provider';

@Injectable()
export class StorageProviderRegistry {
  private readonly providers: Map<string, FileStorageProvider>;

  constructor(databaseStorage: DatabaseStorageProvider) {
    this.providers = new Map([[databaseStorage.name, databaseStorage]]);
  }

  get writeProvider(): FileStorageProvider {
    return this.get(process.env.FILES_STORAGE_DRIVER || 'database');
  }

  get(name: string): FileStorageProvider {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(
        `Unsupported storage provider "${name}". Available: ${[
          ...this.providers.keys(),
        ].join(', ')}`
      );
    }

    return provider;
  }
}
