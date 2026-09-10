import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { SaveWorkResponsesDto } from './dto/save-work-responses.dto';
import { UpdateWorkStatusDto } from './dto/update-work-status.dto';
import { WorksService } from './works.service';

@Controller('tenants/:tenantId')
export class WorksController {
  constructor(private readonly works: WorksService) {}

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
}
