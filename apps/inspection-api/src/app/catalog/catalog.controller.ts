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
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { SetWorkTypeRuleDto } from './dto/set-work-type-rule.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { ActiveTenantGuard } from './guards/active-tenant.guard';

@Controller('tenants')
@UseGuards(ActiveTenantGuard)
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

  @Get(':tenantId/asset-types')
  listAssetTypes(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.catalogService.listAssetTypes(tenantId);
  }

  @Post(':tenantId/asset-types')
  createAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: CreateCatalogItemDto
  ) {
    return this.catalogService.createAssetType(tenantId, dto);
  }

  @Patch(':tenantId/asset-types/:assetTypeId')
  updateAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Body() dto: UpdateCatalogItemDto
  ) {
    return this.catalogService.updateAssetType(tenantId, assetTypeId, dto);
  }

  @Get(':tenantId/asset-types/:assetTypeId/work-types')
  listAssetTypeWorkTypes(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string
  ) {
    return this.catalogService.listAssetTypeWorkTypes(tenantId, assetTypeId);
  }

  @Put(':tenantId/asset-types/:assetTypeId/work-types/:workTypeId')
  associateAssetTypeWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.catalogService.associateAssetTypeWorkType(
      tenantId,
      assetTypeId,
      workTypeId
    );
  }

  @Delete(':tenantId/asset-types/:assetTypeId/work-types/:workTypeId')
  disassociateAssetTypeWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.catalogService.disassociateAssetTypeWorkType(
      tenantId,
      assetTypeId,
      workTypeId
    );
  }

  @Get(':tenantId/work-types')
  listWorkTypes(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.catalogService.listWorkTypes(tenantId);
  }

  @Post(':tenantId/work-types')
  createWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: CreateCatalogItemDto
  ) {
    return this.catalogService.createWorkType(tenantId, dto);
  }

  @Patch(':tenantId/work-types/:workTypeId')
  updateWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() dto: UpdateCatalogItemDto
  ) {
    return this.catalogService.updateWorkType(tenantId, workTypeId, dto);
  }

  @Get(':tenantId/concepts')
  listConcepts(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.catalogService.listConcepts(tenantId);
  }

  @Post(':tenantId/concepts')
  createConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: CreateConceptDto
  ) {
    return this.catalogService.createConcept(tenantId, dto);
  }

  @Patch(':tenantId/concepts/:conceptId')
  updateConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string,
    @Body() dto: UpdateConceptDto
  ) {
    return this.catalogService.updateConcept(tenantId, conceptId, dto);
  }

  @Get(':tenantId/asset-type-concepts')
  listAssetTypeConcepts(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string
  ) {
    return this.catalogService.listAssetTypeConcepts(tenantId);
  }

  @Put(':tenantId/asset-types/:assetTypeId/concepts/:conceptId')
  associateAssetTypeConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string
  ) {
    return this.catalogService.associateAssetTypeConcept(
      tenantId,
      assetTypeId,
      conceptId
    );
  }

  @Delete(':tenantId/asset-types/:assetTypeId/concepts/:conceptId')
  disassociateAssetTypeConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string
  ) {
    return this.catalogService.disassociateAssetTypeConcept(
      tenantId,
      assetTypeId,
      conceptId
    );
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

  @Get(':tenantId/sites/:siteId/assets/:assetId/work-types')
  listEffectiveWorkTypes(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.listEffectiveWorkTypes(
      tenantId,
      siteId,
      assetId
    );
  }

  @Get(':tenantId/sites/:siteId/assets/:assetId/concepts')
  listEffectiveConcepts(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.listEffectiveConcepts(tenantId, siteId, assetId);
  }

  @Get(':tenantId/sites/:siteId/assets/:assetId/work-type-configurations')
  listAssetWorkTypeConfigurations(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.catalogService.listAssetWorkTypeConfigurations(
      tenantId,
      siteId,
      assetId
    );
  }

  @Put(
    ':tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId'
  )
  setAssetWorkTypeOverride(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() dto: SetWorkTypeRuleDto
  ) {
    return this.catalogService.setAssetWorkTypeOverride(
      tenantId,
      siteId,
      assetId,
      workTypeId,
      dto.enabled
    );
  }

  @Delete(
    ':tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId'
  )
  clearAssetWorkTypeOverride(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string
  ) {
    return this.catalogService.clearAssetWorkTypeOverride(
      tenantId,
      siteId,
      assetId,
      workTypeId
    );
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
