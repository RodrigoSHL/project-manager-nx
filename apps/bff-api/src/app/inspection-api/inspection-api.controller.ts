import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  AssetMutationPayload,
  CatalogMutationPayload,
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

  @Get('tenants/:tenantId/asset-types')
  listAssetTypes(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listAssetTypes(tenantId);
  }

  @Post('tenants/:tenantId/asset-types')
  createAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createAssetType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/asset-types/:assetTypeId')
  updateAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Body() payload: CatalogMutationPayload
  ) {
    return this.client.updateAssetType(tenantId, assetTypeId, payload);
  }

  @Get('tenants/:tenantId/asset-types/:assetTypeId/work-types')
  listAssetTypeWorkTypes(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string
  ) {
    return this.client.listAssetTypeWorkTypes(tenantId, assetTypeId);
  }

  @Put('tenants/:tenantId/asset-types/:assetTypeId/work-types/:workTypeId')
  associateAssetTypeWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.client.associateAssetTypeWorkType(
      tenantId,
      assetTypeId,
      workTypeId
    );
  }

  @Delete('tenants/:tenantId/asset-types/:assetTypeId/work-types/:workTypeId')
  disassociateAssetTypeWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.client.disassociateAssetTypeWorkType(
      tenantId,
      assetTypeId,
      workTypeId
    );
  }

  @Get('tenants/:tenantId/work-types')
  listWorkTypes(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listWorkTypes(tenantId);
  }

  @Post('tenants/:tenantId/work-types')
  createWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createWorkType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/work-types/:workTypeId')
  updateWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() payload: CatalogMutationPayload
  ) {
    return this.client.updateWorkType(tenantId, workTypeId, payload);
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

  @Get('tenants/:tenantId/sites/:siteId/assets/:assetId/work-types')
  listEffectiveWorkTypes(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.listEffectiveWorkTypes(tenantId, siteId, assetId);
  }

  @Get(
    'tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations'
  )
  listAssetWorkTypeConfigurations(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.listAssetWorkTypeConfigurations(
      tenantId,
      siteId,
      assetId
    );
  }

  @Put(
    'tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId'
  )
  setAssetWorkTypeOverride(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() payload: { enabled: boolean }
  ) {
    return this.client.setAssetWorkTypeOverride(
      tenantId,
      siteId,
      assetId,
      workTypeId,
      payload.enabled
    );
  }

  @Delete(
    'tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId'
  )
  clearAssetWorkTypeOverride(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.client.clearAssetWorkTypeOverride(
      tenantId,
      siteId,
      assetId,
      workTypeId
    );
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
