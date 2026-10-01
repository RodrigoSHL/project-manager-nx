import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { InspectionApiClient } from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { TenantRoles } from './tenant-roles.decorator';
import { TenantRolesGuard } from './tenant-roles.guard';
import { ReportOptions, WorkReport, WorkReportBuilder } from './work-report';
import { WorkReportPdf } from './work-report-pdf';

@Controller('api/inspection/tenants/:tenantId/works/:workId/report')
@UseGuards(JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard)
export class WorkReportController {
  constructor(
    private readonly builder: WorkReportBuilder,
    private readonly pdf: WorkReportPdf,
    private readonly inspection: InspectionApiClient
  ) {}

  @Get()
  preview(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Request() req: ExpressRequestWithUser
  ) {
    return this.builder.buildWorkReport(tenantId, workId, req.user);
  }

  @Get('versions')
  versions(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.inspection.listReports(tenantId, workId);
  }

  @Get('versions/:reportId')
  version(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Param('reportId', new ParseUUIDPipe()) reportId: string
  ) {
    return this.inspection.getReport(tenantId, workId, reportId);
  }

  @Post('versions')
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR')
  async create(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Request() req: ExpressRequestWithUser,
    @Body() body: { status: 'DRAFT' | 'FINAL'; options?: ReportOptions }
  ) {
    if (!['DRAFT', 'FINAL'].includes(body?.status))
      throw new BadRequestException('Invalid report status');
    const options = body.options || {};
    for (const value of Object.values(options)) {
      if (value != null && (typeof value !== 'string' || value.length > 4000))
        throw new BadRequestException('Invalid report field');
    }
    const reportSnapshot = await this.builder.buildWorkReport(
      tenantId,
      workId,
      req.user,
      { ...options, approvedBy: body.status === 'FINAL' ? req.user.name : null }
    );
    return this.inspection.createReport(tenantId, workId, {
      status: body.status,
      reportSnapshot: reportSnapshot as unknown as Record<string, unknown>,
      generatedBy: req.user.name,
    });
  }

  @Get('pdf')
  async download(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Query('reportId') reportId: string | undefined,
    @Request() req: ExpressRequestWithUser,
    @Res() res: Response
  ) {
    if (reportId && !/^[0-9a-f-]{36}$/i.test(reportId))
      throw new BadRequestException('Invalid report ID');
    const saved = reportId
      ? ((await this.inspection.getReport(tenantId, workId, reportId)) as {
          reportSnapshot: WorkReport;
          version: number;
          status: 'DRAFT' | 'FINAL';
        })
      : null;
    const report =
      saved?.reportSnapshot ||
      (await this.builder.buildWorkReport(tenantId, workId, req.user));
    const buffer = await this.pdf.render(report, req.user, saved || undefined);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-${workId}.pdf"`
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
