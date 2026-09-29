import { Module } from '@nestjs/common';
import { AnalyticsHistoryService } from './analytics-history.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [CatalogModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsHistoryService, AnalyticsService],
  exports: [AnalyticsHistoryService],
})
export class AnalyticsModule {}
