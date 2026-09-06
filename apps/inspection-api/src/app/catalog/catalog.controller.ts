import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('tenants')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  listTenants() {
    return this.catalogService.listTenants();
  }

  @Get(':tenantId/sites')
  listSites(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.catalogService.listSites(tenantId);
  }

  @Get(':tenantId/sites/:siteId/assets')
  listAssets(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string
  ) {
    return this.catalogService.listAssets(tenantId, siteId);
  }

  @Post(':tenantId/sites/:siteId/assets')
  createAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() dto: CreateAssetDto
  ) {
    return this.catalogService.createAsset(tenantId, siteId, dto);
  }

  @Get(':tenantId/sites/:siteId/assets/:assetId')
  getAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.getAsset(tenantId, siteId, assetId);
  }

  @Patch(':tenantId/sites/:siteId/assets/:assetId')
  updateAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: UpdateAssetDto
  ) {
    return this.catalogService.updateAsset(tenantId, siteId, assetId, dto);
  }

  @Delete(':tenantId/sites/:siteId/assets/:assetId')
  deleteAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.deleteAsset(tenantId, siteId, assetId);
  }
}
