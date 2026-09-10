import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../catalog/entities/asset.entity';
import { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkEntity } from '../works/entities/work.entity';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      SiteEntity,
      AssetEntity,
      WorkEntity,
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
