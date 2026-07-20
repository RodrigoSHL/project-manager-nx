import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { FilesService, UploadedFile } from './files.service';
import { FileStorageProvider } from './storage/storage-provider';
import { StorageProviderRegistry } from './storage/storage-provider.registry';

describe('FilesService', () => {
  const incomingFile: UploadedFile = {
    buffer: Buffer.from('content'),
    mimetype: 'text/plain',
    originalname: 'example.txt',
    size: 7,
  };

  let repository: {
    create: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    save: jest.Mock;
  };
  let storage: jest.Mocked<FileStorageProvider>;
  let registry: Pick<StorageProviderRegistry, 'get' | 'writeProvider'>;
  let service: FilesService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value as StoredFile),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value as StoredFile)),
    };
    storage = {
      name: 'database',
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
    registry = {
      get: jest.fn(() => storage),
      writeProvider: storage,
    };
    service = new FilesService(
      repository as unknown as Repository<StoredFile>,
      registry as StorageProviderRegistry
    );
  });

  it('stores content and metadata with a checksum', async () => {
    const result = await service.create(incomingFile, {
      application: 'project-web',
      ownerType: 'project',
      ownerId: 'project-1',
    });

    expect(storage.put).toHaveBeenCalledWith(
      expect.stringMatching(/^project-web\/[0-9a-f-]+$/),
      incomingFile.buffer
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        checksumSha256:
          'ed7002b439e9ac845f22357d822bac1444730fbdb6016d3ec9432297b9ec9f73',
        storageProvider: 'database',
      })
    );
    expect(result.originalName).toBe('example.txt');
  });

  it('requires ownerType and ownerId together', async () => {
    await expect(
      service.create(incomingFile, {
        application: 'project-web',
        ownerType: 'project',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('reads content from the provider recorded in metadata', async () => {
    repository.findOne.mockResolvedValue({
      id: 'file-id',
      storageKey: 'legacy/file-id',
      storageProvider: 'database',
    } as StoredFile);
    storage.get.mockResolvedValue(incomingFile.buffer);

    await expect(service.download('file-id')).resolves.toEqual({
      file: expect.objectContaining({ id: 'file-id' }),
      data: incomingFile.buffer,
    });
    expect(registry.get).toHaveBeenCalledWith('database');
    expect(storage.get).toHaveBeenCalledWith('legacy/file-id');
  });
});
