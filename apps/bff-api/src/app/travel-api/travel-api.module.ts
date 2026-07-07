import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TravelApiClient } from './travel-api.client';
import { TravelApiController } from './travel-api.controller';

@Module({
  imports: [AuthModule],
  controllers: [TravelApiController],
  providers: [TravelApiClient],
})
export class TravelApiModule {}
