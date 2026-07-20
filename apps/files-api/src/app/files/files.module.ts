import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileBlob } from './entities/file-blob.entity';
import { StoredFile } from './entities/stored-file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DatabaseStorageProvider } from './storage/database-storage.provider';
import { StorageProviderRegistry } from './storage/storage-provider.registry';

@Module({
  imports: [TypeOrmModule.forFeature([StoredFile, FileBlob])],
  controllers: [FilesController],
  providers: [FilesService, DatabaseStorageProvider, StorageProviderRegistry],
})
export class FilesModule {}
