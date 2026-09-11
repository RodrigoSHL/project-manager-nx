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
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import {
  AssetMutationPayload,
  CatalogMutationPayload,
  ConceptMutationPayload,
  FormItemMutationPayload,
  FormSectionMutationPayload,
  FormTemplateMutationPayload,
  InspectionApiClient,
  SiteMutationPayload,
  WorkMutationPayload,
  WorkResponsesPayload,
} from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';

@Controller('api/inspection')
@UseGuards(JwtAuthGuard, InspectionTenantAccessGuard, RolesGuard)
export class InspectionApiController {
  constructor(private readonly client: InspectionApiClient) {}

  @Get('tenants')
  listTenants(@Request() request: ExpressRequestWithUser) {
    return request.user.roles.includes(UserRole.ADMIN)
      ? this.client.listTenants()
      : this.client.listAccessibleTenants(request.user.userId);
  }

  @Get('tenants/:tenantId/works')
  listWorks(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listWorks(tenantId);
  }

  @Get('tenants/:tenantId/works/:workId')
  getWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.client.getWork(tenantId, workId);
  }

  @Post('tenants/:tenantId/sites/:siteId/assets/:assetId/works')
  createWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() payload: WorkMutationPayload
  ) {
    return this.client.createWork(tenantId, siteId, assetId, payload);
  }

  @Put('tenants/:tenantId/works/:workId/responses')
  saveWorkResponses(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() payload: WorkResponsesPayload
  ) {
    return this.client.saveWorkResponses(tenantId, workId, payload);
  }

  @Patch('tenants/:tenantId/works/:workId/status')
  startWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.client.startWork(tenantId, workId);
  }

  @Post('tenants/:tenantId/works/:workId/finish')
  finishWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() payload: WorkResponsesPayload
  ) {
    return this.client.finishWork(tenantId, workId, payload);
  }

  @Get('tenants/:tenantId/sites')
  listSites(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listSites(tenantId);
  }

  @Post('tenants/:tenantId/sites')
  @Roles(UserRole.ADMIN)
  createSite(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<SiteMutationPayload>
  ) {
    return this.client.createSite(tenantId, payload);
  }

  @Patch('tenants/:tenantId/sites/:siteId')
  @Roles(UserRole.ADMIN)
  updateSite(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() payload: SiteMutationPayload
  ) {
    return this.client.updateSite(tenantId, siteId, payload);
  }

  @Get('tenants/:tenantId/asset-types')
  listAssetTypes(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listAssetTypes(tenantId);
  }

  @Post('tenants/:tenantId/asset-types')
  @Roles(UserRole.ADMIN)
  createAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createAssetType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/asset-types/:assetTypeId')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  createWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createWorkType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/work-types/:workTypeId')
  @Roles(UserRole.ADMIN)
  updateWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() payload: CatalogMutationPayload
  ) {
    return this.client.updateWorkType(tenantId, workTypeId, payload);
  }

  @Get('tenants/:tenantId/form-templates')
  listFormTemplates(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listFormTemplates(tenantId);
  }

  @Post('tenants/:tenantId/work-types/:workTypeId/form-template')
  @Roles(UserRole.ADMIN)
  createFormTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() payload: FormTemplateMutationPayload
  ) {
    return this.client.createFormTemplate(tenantId, workTypeId, payload);
  }

  @Patch('tenants/:tenantId/form-templates/:templateId')
  @Roles(UserRole.ADMIN)
  updateFormTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() payload: FormTemplateMutationPayload
  ) {
    return this.client.updateFormTemplate(tenantId, templateId, payload);
  }

  @Post('tenants/:tenantId/form-templates/:templateId/sections')
  @Roles(UserRole.ADMIN)
  createFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() payload: FormSectionMutationPayload
  ) {
    return this.client.createFormSection(tenantId, templateId, payload);
  }

  @Patch('tenants/:tenantId/form-sections/:sectionId')
  @Roles(UserRole.ADMIN)
  updateFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() payload: FormSectionMutationPayload
  ) {
    return this.client.updateFormSection(tenantId, sectionId, payload);
  }

  @Delete('tenants/:tenantId/form-sections/:sectionId')
  @Roles(UserRole.ADMIN)
  deleteFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string
  ) {
    return this.client.deleteFormSection(tenantId, sectionId);
  }

  @Put('tenants/:tenantId/form-templates/:templateId/section-order')
  @Roles(UserRole.ADMIN)
  reorderFormSections(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() payload: { orderedIds: string[] }
  ) {
    return this.client.reorderFormSections(
      tenantId,
      templateId,
      payload.orderedIds
    );
  }

  @Post('tenants/:tenantId/form-sections/:sectionId/items')
  @Roles(UserRole.ADMIN)
  createFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() payload: FormItemMutationPayload
  ) {
    return this.client.createFormItem(tenantId, sectionId, payload);
  }

  @Patch('tenants/:tenantId/form-items/:itemId')
  @Roles(UserRole.ADMIN)
  updateFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() payload: FormItemMutationPayload
  ) {
    return this.client.updateFormItem(tenantId, itemId, payload);
  }

  @Delete('tenants/:tenantId/form-items/:itemId')
  @Roles(UserRole.ADMIN)
  deleteFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string
  ) {
    return this.client.deleteFormItem(tenantId, itemId);
  }

  @Put('tenants/:tenantId/form-sections/:sectionId/item-order')
  @Roles(UserRole.ADMIN)
  reorderFormItems(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() payload: { orderedIds: string[] }
  ) {
    return this.client.reorderFormItems(
      tenantId,
      sectionId,
      payload.orderedIds
    );
  }

  @Get('tenants/:tenantId/concepts')
  listConcepts(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listConcepts(tenantId);
  }

  @Post('tenants/:tenantId/concepts')
  @Roles(UserRole.ADMIN)
  createConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<ConceptMutationPayload>
  ) {
    return this.client.createConcept(tenantId, payload);
  }

  @Patch('tenants/:tenantId/concepts/:conceptId')
  @Roles(UserRole.ADMIN)
  updateConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string,
    @Body() payload: ConceptMutationPayload
  ) {
    return this.client.updateConcept(tenantId, conceptId, payload);
  }

  @Get('tenants/:tenantId/asset-type-concepts')
  listAssetTypeConcepts(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string
  ) {
    return this.client.listAssetTypeConcepts(tenantId);
  }

  @Put('tenants/:tenantId/asset-types/:assetTypeId/concepts/:conceptId')
  @Roles(UserRole.ADMIN)
  associateAssetTypeConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string
  ) {
    return this.client.associateAssetTypeConcept(
      tenantId,
      assetTypeId,
      conceptId
    );
  }

  @Delete('tenants/:tenantId/asset-types/:assetTypeId/concepts/:conceptId')
  @Roles(UserRole.ADMIN)
  disassociateAssetTypeConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('assetTypeId', new ParseUUIDPipe()) assetTypeId: string,
    @Param('conceptId', new ParseUUIDPipe()) conceptId: string
  ) {
    return this.client.disassociateAssetTypeConcept(
      tenantId,
      assetTypeId,
      conceptId
    );
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

  @Get('tenants/:tenantId/sites/:siteId/assets/:assetId/concepts')
  listEffectiveConcepts(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.listEffectiveConcepts(tenantId, siteId, assetId);
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  createAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() payload: Required<AssetMutationPayload>
  ) {
    return this.client.createAsset(tenantId, siteId, payload);
  }

  @Patch('tenants/:tenantId/sites/:siteId/assets/:assetId')
  @Roles(UserRole.ADMIN)
  updateAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() payload: AssetMutationPayload
  ) {
    return this.client.updateAsset(tenantId, siteId, assetId, payload);
  }

  @Delete('tenants/:tenantId/sites/:siteId/assets/:assetId')
  @Roles(UserRole.ADMIN)
  deleteAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.deleteAsset(tenantId, siteId, assetId);
  }
}
