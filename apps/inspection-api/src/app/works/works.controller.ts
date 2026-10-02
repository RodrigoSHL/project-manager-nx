import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ActiveTenantGuard } from '../catalog/guards/active-tenant.guard';
import { CreateWorkDto } from './dto/create-work.dto';
import { SaveWorkResponsesDto } from './dto/save-work-responses.dto';
import { UpdateWorkStatusDto } from './dto/update-work-status.dto';
import { WorksService } from './works.service';
import { GeneratedReportsService } from './generated-reports.service';
import { GeneratedReportStatus } from './entities/generated-report.entity';
import { FindingReviewService } from './finding-review.service';
import {
  ConfirmFindingDto,
  DiscardFindingCandidateDto,
} from './dto/review-finding.dto';

@Controller('tenants/:tenantId')
@UseGuards(ActiveTenantGuard)
export class WorksController {
  constructor(
    private readonly works: WorksService,
    private readonly review: FindingReviewService,
    private readonly reports: GeneratedReportsService
  ) {}

  @Get('works')
  list(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.works.list(tenantId);
  }

  @Get('works/:workId')
  getById(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.works.getById(tenantId, workId);
  }

  @Get('works/:workId/reports')
  listReports(@Param('tenantId', new ParseUUIDPipe()) tenantId: string, @Param('workId', new ParseUUIDPipe()) workId: string) {
    return this.reports.list(tenantId, workId);
  }

  @Get('works/:workId/reports/:reportId')
  getReport(@Param('tenantId', new ParseUUIDPipe()) tenantId: string, @Param('workId', new ParseUUIDPipe()) workId: string, @Param('reportId', new ParseUUIDPipe()) reportId: string) {
    return this.reports.get(tenantId, workId, reportId);
  }

  @Post('works/:workId/reports')
  createReport(@Param('tenantId', new ParseUUIDPipe()) tenantId: string, @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() body: { status: GeneratedReportStatus; reportSnapshot: Record<string, unknown>; generatedBy?: string }) {
    return this.reports.create(tenantId, workId, body.status, body.reportSnapshot, body.generatedBy);
  }

  @Post('sites/:siteId/assets/:assetId/works')
  create(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: CreateWorkDto
  ) {
    return this.works.create(tenantId, siteId, assetId, dto);
  }

  @Put('works/:workId/responses')
  saveResponses(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() dto: SaveWorkResponsesDto
  ) {
    return this.works.saveResponses(tenantId, workId, dto);
  }

  @Patch('works/:workId/status')
  updateStatus(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() dto: UpdateWorkStatusDto
  ) {
    return this.works.updateStatus(tenantId, workId, dto.status);
  }

  @Post('works/:workId/finish')
  finish(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() dto: SaveWorkResponsesDto
  ) {
    return this.works.finish(tenantId, workId, dto);
  }

  @Put('works/:workId/finding-candidates/:candidateId/confirm')
  confirmFinding(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Param('candidateId', new ParseUUIDPipe()) candidateId: string,
    @Body() dto: ConfirmFindingDto
  ) {
    return this.review.confirm(tenantId, workId, candidateId, dto);
  }

  @Put('works/:workId/finding-candidates/:candidateId/discard')
  discardCandidate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Param('candidateId', new ParseUUIDPipe()) candidateId: string,
    @Body() dto: DiscardFindingCandidateDto
  ) {
    return this.review.discard(tenantId, workId, candidateId, dto);
  }

  @Post('works/:workId/review/finalize')
  finalizeReview(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.review.finalize(tenantId, workId);
  }
}
