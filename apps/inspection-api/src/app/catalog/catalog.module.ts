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
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
