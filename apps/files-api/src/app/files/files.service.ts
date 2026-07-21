import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { StoredFile } from './entities/stored-file.entity';
import { StorageObjectNotFoundError } from './storage/storage-provider';
import { StorageProviderRegistry } from './storage/storage-provider.registry';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
    private readonly storageProviders: StorageProviderRegistry
  ) {}

  async create(file: UploadedFile, dto: UploadFileDto): Promise<StoredFile> {
    this.validateOwner(dto);

    const storage = this.storageProviders.writeProvider;
    const storageKey = `${dto.application}/${randomUUID()}`;
    const entity = this.fileRepository.create({
      application: dto.application,
      ownerType: dto.ownerType || null,
      ownerId: dto.ownerId || null,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
      storageProvider: storage.name,
      storageKey,
      metadata: dto.metadata || {},
    });

    await storage.put(storageKey, file.buffer);

    try {
      return await this.fileRepository.save(entity);
    } catch (error) {
      await storage.delete(storageKey);
      throw error;
    }
  }

  findAll(query: ListFilesQueryDto): Promise<StoredFile[]> {
    const where: FindOptionsWhere<StoredFile> = {};

    if (query.application) where.application = query.application;
    if (query.ownerType) where.ownerType = query.ownerType;
    if (query.ownerId) where.ownerId = query.ownerId;

    return this.fileRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<StoredFile> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException(`File ${id} was not found`);
    }

    return file;
  }

  async download(id: string): Promise<{ file: StoredFile; data: Buffer }> {
    const file = await this.findOne(id);
    const storage = this.storageProviders.get(file.storageProvider);

    try {
      const data = await storage.get(file.storageKey);
      return { file, data };
    } catch (error) {
      if (error instanceof StorageObjectNotFoundError) {
        throw new NotFoundException(`Content for file ${id} was not found`);
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);
    const storage = this.storageProviders.get(file.storageProvider);
    await storage.delete(file.storageKey);
    await this.fileRepository.remove(file);
  }

  private validateOwner(dto: UploadFileDto): void {
    if (Boolean(dto.ownerType) !== Boolean(dto.ownerId)) {
      throw new BadRequestException(
        'ownerType and ownerId must be provided together'
      );
    }
  }
}
