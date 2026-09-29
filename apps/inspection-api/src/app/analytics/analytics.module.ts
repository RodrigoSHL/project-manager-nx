import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsHistoryService } from './analytics-history.service';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [CatalogModule, TypeOrmModule.forFeature([TenantEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsHistoryService, AnalyticsService],
  exports: [AnalyticsHistoryService],
})
export class AnalyticsModule {}
