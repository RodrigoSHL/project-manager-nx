import { Module } from '@nestjs/common';
import { MacrofitApiController } from './macrofit-api.controller';
import { MacrofitApiClient } from './macrofit-api.client';
import { MacrofitRecordsController } from './macrofit-records.controller';

@Module({
  controllers: [MacrofitApiController, MacrofitRecordsController],
  providers: [MacrofitApiClient],
})
export class MacrofitApiModule {}
