import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CreateInspectionCatalog1799100000000 } from '../../migrations/1799100000000-CreateInspectionCatalog';
import { SeedInspectionCatalog1799100100000 } from '../../migrations/1799100100000-SeedInspectionCatalog';
import { CreateAssetWorkTypeCatalogs1799100200000 } from '../../migrations/1799100200000-CreateAssetWorkTypeCatalogs';
import { SeedAssetWorkTypeCatalogs1799100300000 } from '../../migrations/1799100300000-SeedAssetWorkTypeCatalogs';
import { CreateConceptCatalogs1799100400000 } from '../../migrations/1799100400000-CreateConceptCatalogs';
import { SeedConceptCatalogs1799100500000 } from '../../migrations/1799100500000-SeedConceptCatalogs';
import { AssetEntity } from '../catalog/entities/asset.entity';
import { AssetTypeEntity } from '../catalog/entities/asset-type.entity';
import { AssetTypeWorkTypeEntity } from '../catalog/entities/asset-type-work-type.entity';
import { AssetWorkTypeEntity } from '../catalog/entities/asset-work-type.entity';
import { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkTypeEntity } from '../catalog/entities/work-type.entity';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { ConceptOptionEntity } from '../catalog/entities/concept-option.entity';
import { AssetTypeConceptEntity } from '../catalog/entities/asset-type-concept.entity';
import { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import { FormSectionEntity } from '../form-templates/entities/form-section.entity';
import { FormItemEntity } from '../form-templates/entities/form-item.entity';
import { CreateFormTemplates1799100600000 } from '../../migrations/1799100600000-CreateFormTemplates';
import { SeedFormTemplates1799100700000 } from '../../migrations/1799100700000-SeedFormTemplates';
import { CreateWorks1799100800000 } from '../../migrations/1799100800000-CreateWorks';
import { SeedWorks1799100900000 } from '../../migrations/1799100900000-SeedWorks';
import { ExtendTenantsForPlatformAdministration1799101000000 } from '../../migrations/1799101000000-ExtendTenantsForPlatformAdministration';
import { CreateTenantMemberships1799101100000 } from '../../migrations/1799101100000-CreateTenantMemberships';
import { ConceptResponseEntity } from '../works/entities/concept-response.entity';
import { TaskCompletionEntity } from '../works/entities/task-completion.entity';
import { WorkEntity } from '../works/entities/work.entity';
import { TenantMembershipEntity } from '../platform/entities/tenant-membership.entity';
import { WorkItemAnnotationEntity } from '../works/entities/work-item-annotation.entity';
import { CreateWorkItemAnnotations1799101200000 } from '../../migrations/1799101200000-CreateWorkItemAnnotations';

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
    ConceptEntity,
    ConceptOptionEntity,
    AssetTypeConceptEntity,
    FormTemplateEntity,
    FormSectionEntity,
    FormItemEntity,
    WorkEntity,
    ConceptResponseEntity,
    TaskCompletionEntity,
    TenantMembershipEntity,
    WorkItemAnnotationEntity,
  ],
  migrations: [
    CreateInspectionCatalog1799100000000,
    SeedInspectionCatalog1799100100000,
    CreateAssetWorkTypeCatalogs1799100200000,
    SeedAssetWorkTypeCatalogs1799100300000,
    CreateConceptCatalogs1799100400000,
    SeedConceptCatalogs1799100500000,
    CreateFormTemplates1799100600000,
    SeedFormTemplates1799100700000,
    CreateWorks1799100800000,
    SeedWorks1799100900000,
    ExtendTenantsForPlatformAdministration1799101000000,
    CreateTenantMemberships1799101100000,
    CreateWorkItemAnnotations1799101200000,
  ],
  migrationsRun: process.env.INSPECTION_MIGRATIONS_RUN === 'true',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
