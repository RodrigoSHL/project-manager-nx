import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InspectionApiClient } from './inspection-api.client';
import { InspectionApiController } from './inspection-api.controller';
import { PlatformAdminController } from './platform-admin.controller';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { UserApiModule } from '../user-api/user-api.module';
import { TenantRolesGuard } from './tenant-roles.guard';

@Module({
  imports: [AuthModule, UserApiModule],
  controllers: [InspectionApiController, PlatformAdminController],
  providers: [
    InspectionApiClient,
    InspectionTenantAccessGuard,
    TenantRolesGuard,
  ],
  exports: [InspectionApiClient],
})
export class InspectionApiModule {}
