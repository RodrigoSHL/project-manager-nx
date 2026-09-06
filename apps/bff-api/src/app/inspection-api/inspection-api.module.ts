import { Module } from '@nestjs/common';
import { InspectionApiClient } from './inspection-api.client';
import { InspectionApiController } from './inspection-api.controller';

@Module({
  controllers: [InspectionApiController],
  providers: [InspectionApiClient],
  exports: [InspectionApiClient],
})
export class InspectionApiModule {}
