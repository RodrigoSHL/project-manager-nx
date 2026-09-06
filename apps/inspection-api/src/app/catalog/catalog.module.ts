import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { AssetEntity } from './entities/asset.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity, SiteEntity, AssetEntity])],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
