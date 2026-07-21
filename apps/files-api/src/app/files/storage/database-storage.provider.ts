import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileBlob } from '../entities/file-blob.entity';
import {
  FileStorageProvider,
  StorageObjectNotFoundError,
} from './storage-provider';

@Injectable()
export class DatabaseStorageProvider implements FileStorageProvider {
  readonly name = 'database';

  constructor(
    @InjectRepository(FileBlob)
    private readonly blobRepository: Repository<FileBlob>
  ) {}

  async put(storageKey: string, data: Buffer): Promise<void> {
    await this.blobRepository.save(
      this.blobRepository.create({ storageKey, data })
    );
  }

  async get(storageKey: string): Promise<Buffer> {
    const blob = await this.blobRepository.findOne({ where: { storageKey } });

    if (!blob) {
      throw new StorageObjectNotFoundError(storageKey);
    }

    return blob.data;
  }

  async delete(storageKey: string): Promise<void> {
    await this.blobRepository.delete({ storageKey });
  }
}
