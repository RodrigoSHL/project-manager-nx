import { Module } from '@nestjs/common';
import { MacrofitApiController } from './macrofit-api.controller';
import { MacrofitApiClient } from './macrofit-api.client';

@Module({
  controllers: [MacrofitApiController],
  providers: [MacrofitApiClient],
})
export class MacrofitApiModule {}
