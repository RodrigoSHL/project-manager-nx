import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { AssetEntity } from './entities/asset.entity';
import { AssetTypeEntity } from './entities/asset-type.entity';
import { WorkTypeEntity } from './entities/work-type.entity';
import { AssetTypeWorkTypeEntity } from './entities/asset-type-work-type.entity';
import { AssetWorkTypeEntity } from './entities/asset-work-type.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';
import { ConceptEntity } from './entities/concept.entity';
import { ConceptOptionEntity } from './entities/concept-option.entity';
import { AssetTypeConceptEntity } from './entities/asset-type-concept.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
