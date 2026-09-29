import { Module } from '@nestjs/common';
import { AnalyticsHistoryService } from './analytics-history.service';

@Module({
  providers: [AnalyticsHistoryService],
  exports: [AnalyticsHistoryService],
})
export class AnalyticsModule {}
