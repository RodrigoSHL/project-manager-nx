import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { FileBlob } from '../files/entities/file-blob.entity';
import { StoredFile } from '../files/entities/stored-file.entity';
import { CreateFilesStorage1784592000000 } from '../../migrations/1784592000000-CreateFilesStorage';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.FILES_DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.FILES_DB_PORT || process.env.DATABASE_PORT || 5432),
  username:
    process.env.FILES_DB_USERNAME ||
    process.env.DATABASE_USERNAME ||
    'postgres',
  password:
    process.env.FILES_DB_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    'postgres',
  database: process.env.FILES_DB_NAME || 'files_db',
  entities: [StoredFile, FileBlob],
  migrations: [CreateFilesStorage1784592000000],
  migrationsRun: process.env.FILES_MIGRATIONS_RUN === 'true',
  synchronize: process.env.TYPEORM_SYNCHRONIZE
    ? process.env.TYPEORM_SYNCHRONIZE === 'true'
    : process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
