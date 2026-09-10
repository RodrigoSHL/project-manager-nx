import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InspectionApiClient } from './inspection-api.client';
import { InspectionApiController } from './inspection-api.controller';
import { PlatformAdminController } from './platform-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [InspectionApiController, PlatformAdminController],
  providers: [InspectionApiClient],
  exports: [InspectionApiClient],
})
export class InspectionApiModule {}
