import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CreateInspectionCatalog1799100000000 } from '../../migrations/1799100000000-CreateInspectionCatalog';
import { SeedInspectionCatalog1799100100000 } from '../../migrations/1799100100000-SeedInspectionCatalog';
import { CreateAssetWorkTypeCatalogs1799100200000 } from '../../migrations/1799100200000-CreateAssetWorkTypeCatalogs';
import { SeedAssetWorkTypeCatalogs1799100300000 } from '../../migrations/1799100300000-SeedAssetWorkTypeCatalogs';
import { AssetEntity } from '../catalog/entities/asset.entity';
import { AssetTypeEntity } from '../catalog/entities/asset-type.entity';
import { AssetTypeWorkTypeEntity } from '../catalog/entities/asset-type-work-type.entity';
import { AssetWorkTypeEntity } from '../catalog/entities/asset-work-type.entity';
import { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkTypeEntity } from '../catalog/entities/work-type.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host:
    process.env.INSPECTION_DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: Number(
    process.env.INSPECTION_DB_PORT || process.env.DATABASE_PORT || 5432
  ),
  username:
    process.env.INSPECTION_DB_USERNAME ||
    process.env.DATABASE_USERNAME ||
    'postgres',
  password:
    process.env.INSPECTION_DB_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    'postgres',
  database: process.env.INSPECTION_DB_NAME || 'inspection_db',
  entities: [
    TenantEntity,
    SiteEntity,
    AssetEntity,
    AssetTypeEntity,
    WorkTypeEntity,
    AssetTypeWorkTypeEntity,
    AssetWorkTypeEntity,
  ],
  migrations: [
    CreateInspectionCatalog1799100000000,
    SeedInspectionCatalog1799100100000,
    CreateAssetWorkTypeCatalogs1799100200000,
    SeedAssetWorkTypeCatalogs1799100300000,
  ],
  migrationsRun: process.env.INSPECTION_MIGRATIONS_RUN === 'true',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
