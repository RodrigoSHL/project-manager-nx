import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../catalog/entities/asset.entity';
import { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkEntity } from '../works/entities/work.entity';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { TenantAccessController } from './tenant-access.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      SiteEntity,
      AssetEntity,
      WorkEntity,
      TenantMembershipEntity,
    ]),
  ],
  controllers: [PlatformController, TenantAccessController],
  providers: [PlatformService],
})
export class PlatformModule {}
