import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';

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

  @Get(':tenantId/sites/:siteId/assets/:assetId')
  getAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.getAsset(tenantId, siteId, assetId);
  }
}
