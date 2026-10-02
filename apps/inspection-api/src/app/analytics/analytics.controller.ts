import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActiveTenantGuard } from '../catalog/guards/active-tenant.guard';
import { AnalyticsService } from './analytics.service';
import {
  ActivityFiltersDto,
  AnalyticsFiltersDto,
  ConceptsFiltersDto,
  FindingsFiltersDto,
  HistoryFiltersDto,
  MeasurementsFiltersDto,
} from './dto/analytics-filters.dto';

@Controller('tenants/:tenantId/analytics')
@UseGuards(ActiveTenantGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() filters: AnalyticsFiltersDto
  ) {
    return this.analytics.summary(tenantId, filters);
  }

  @Get('findings')
  findings(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() filters: FindingsFiltersDto
  ) {
    return this.analytics.findings(tenantId, filters);
  }

  @Get('measurements')
  measurements(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() filters: MeasurementsFiltersDto
  ) {
    return this.analytics.measurements(tenantId, filters);
  }

  @Get('assets/:assetId/history')
  assetHistory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query() filters: HistoryFiltersDto
  ) {
    return this.analytics.assetHistory(tenantId, assetId, filters);
  }

  @Get('activity')
  activity(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() filters: ActivityFiltersDto
  ) {
    return this.analytics.activity(tenantId, filters);
  }

  @Get('concepts')
  concepts(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() filters: ConceptsFiltersDto
  ) {
    return this.analytics.concepts(tenantId, filters);
  }
}
