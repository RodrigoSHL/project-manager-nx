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
import {
  AssetMutationPayload,
  InspectionApiClient,
} from './inspection-api.client';

@Controller('api/inspection')
export class InspectionApiController {
  constructor(private readonly client: InspectionApiClient) {}

  @Get('tenants')
  listTenants() {
    return this.client.listTenants();
  }

  @Get('tenants/:tenantId/sites')
  listSites(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listSites(tenantId);
  }

  @Get('tenants/:tenantId/sites/:siteId/assets')
  listAssets(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string
  ) {
    return this.client.listAssets(tenantId, siteId);
  }

  @Get('tenants/:tenantId/sites/:siteId/assets/:assetId')
  getAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.getAsset(tenantId, siteId, assetId);
  }

  @Post('tenants/:tenantId/sites/:siteId/assets')
  createAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() payload: Required<AssetMutationPayload>
  ) {
    return this.client.createAsset(tenantId, siteId, payload);
  }

  @Patch('tenants/:tenantId/sites/:siteId/assets/:assetId')
  updateAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() payload: AssetMutationPayload
  ) {
    return this.client.updateAsset(tenantId, siteId, assetId, payload);
  }

  @Delete('tenants/:tenantId/sites/:siteId/assets/:assetId')
  deleteAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.deleteAsset(tenantId, siteId, assetId);
  }
}
