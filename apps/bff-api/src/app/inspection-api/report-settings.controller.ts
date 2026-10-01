import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  InspectionApiClient,
  ReportCoverDefaults,
} from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { TenantRoles } from './tenant-roles.decorator';
import { TenantRolesGuard } from './tenant-roles.guard';

const coverFields = [
  'content',
  'requestedBy',
  'preparedBy',
  'distribution',
  'receivedBy',
  'introduction',
] as const;

@Controller('api/inspection/tenants/:tenantId/report-settings')
@UseGuards(JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard)
export class ReportSettingsController {
  constructor(private readonly inspection: InspectionApiClient) {}

  @Get()
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.inspection.getReportSettings(tenantId);
  }

  @Put()
  @TenantRoles('TENANT_ADMIN')
  saveDefaults(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() body: { defaults?: ReportCoverDefaults }
  ) {
    if (!body?.defaults || typeof body.defaults !== 'object')
      throw new BadRequestException('Report defaults are required');
    const defaults: ReportCoverDefaults = {};
    for (const field of coverFields) {
      const value = body.defaults[field];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || value.length > 4000)
          throw new BadRequestException(`Invalid report field: ${field}`);
        defaults[field] = value.trim() || null;
      }
    }
    return this.inspection.saveReportDefaults(tenantId, defaults);
  }

  @Post('logo')
  @TenantRoles('TENANT_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } })
  )
  async uploadLogo(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number }
  ) {
    if (
      !file ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)
    )
      throw new BadRequestException('Select a PNG, JPG or WebP logo');
    let buffer: Buffer;
    try {
      buffer = await sharp(file.buffer)
        .rotate()
        .resize(600, 240, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Invalid logo image');
    }
    if (buffer.length > 64 * 1024)
      throw new BadRequestException('Logo is too complex; use a simpler image');
    return this.inspection.saveReportLogo(
      tenantId,
      `data:image/webp;base64,${buffer.toString('base64')}`
    );
  }

  @Delete('logo')
  @TenantRoles('TENANT_ADMIN')
  removeLogo(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.inspection.saveReportLogo(tenantId, null);
  }
}
