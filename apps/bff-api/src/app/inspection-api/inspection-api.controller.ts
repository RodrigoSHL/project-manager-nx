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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  SyncPushPayload,
  WorkMutationPayload,
  WorkResponsesPayload,
} from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { TenantRoles } from './tenant-roles.decorator';
import { TenantRolesGuard } from './tenant-roles.guard';

@Controller('api/inspection')
@UseGuards(JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard)
export class InspectionApiController {
  constructor(private readonly client: InspectionApiClient) {}

  @Get('tenants')
  listTenants(@Request() request: ExpressRequestWithUser) {
    return request.user.roles.includes(UserRole.ADMIN)
      ? this.client.listTenants()
      : this.client.listAccessibleTenants(request.user.userId);
  }

  @Get('admin/tenants')
  async listAdministrableTenants(@Request() request: ExpressRequestWithUser) {
    if (request.user.roles.includes(UserRole.ADMIN)) {
      return this.client.listTenants();
    }
    const tenants = await this.client.listAccessibleTenants(
      request.user.userId
    );
    return tenants.filter((tenant) => tenant.membershipRole === 'TENANT_ADMIN');
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
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR')
  createWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() payload: WorkMutationPayload
  ) {
    return this.client.createWork(tenantId, siteId, assetId, payload);
  }

  @Put('tenants/:tenantId/works/:workId/responses')
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR')
  saveWorkResponses(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() payload: WorkResponsesPayload
  ) {
    return this.client.saveWorkResponses(tenantId, workId, payload);
  }

  @Patch('tenants/:tenantId/works/:workId/status')
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR')
  startWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string
  ) {
    return this.client.startWork(tenantId, workId);
  }

  @Post('tenants/:tenantId/works/:workId/finish')
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR')
  finishWork(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workId', new ParseUUIDPipe()) workId: string,
    @Body() payload: WorkResponsesPayload
  ) {
    return this.client.finishWork(tenantId, workId, payload);
  }

  @Post('tenants/:tenantId/sync/push')
  @TenantRoles('TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR')
  pushSync(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: SyncPushPayload
  ) {
    return this.client.pushSync(tenantId, payload);
  }

  @Get('tenants/:tenantId/sites')
  listSites(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.listSites(tenantId);
  }

  @Post('tenants/:tenantId/sites')
  @TenantRoles('TENANT_ADMIN')
  createSite(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<SiteMutationPayload>
  ) {
    return this.client.createSite(tenantId, payload);
  }

  @Patch('tenants/:tenantId/sites/:siteId')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createAssetType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createAssetType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/asset-types/:assetTypeId')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createWorkType(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<CatalogMutationPayload>
  ) {
    return this.client.createWorkType(tenantId, payload);
  }

  @Patch('tenants/:tenantId/work-types/:workTypeId')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createFormTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() payload: FormTemplateMutationPayload
  ) {
    return this.client.createFormTemplate(tenantId, workTypeId, payload);
  }

  @Patch('tenants/:tenantId/form-templates/:templateId')
  @TenantRoles('TENANT_ADMIN')
  updateFormTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() payload: FormTemplateMutationPayload
  ) {
    return this.client.updateFormTemplate(tenantId, templateId, payload);
  }

  @Post('tenants/:tenantId/form-templates/:templateId/sections')
  @TenantRoles('TENANT_ADMIN')
  createFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() payload: FormSectionMutationPayload
  ) {
    return this.client.createFormSection(tenantId, templateId, payload);
  }

  @Patch('tenants/:tenantId/form-sections/:sectionId')
  @TenantRoles('TENANT_ADMIN')
  updateFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() payload: FormSectionMutationPayload
  ) {
    return this.client.updateFormSection(tenantId, sectionId, payload);
  }

  @Delete('tenants/:tenantId/form-sections/:sectionId')
  @TenantRoles('TENANT_ADMIN')
  deleteFormSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string
  ) {
    return this.client.deleteFormSection(tenantId, sectionId);
  }

  @Put('tenants/:tenantId/form-templates/:templateId/section-order')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() payload: FormItemMutationPayload
  ) {
    return this.client.createFormItem(tenantId, sectionId, payload);
  }

  @Patch('tenants/:tenantId/form-items/:itemId')
  @TenantRoles('TENANT_ADMIN')
  updateFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() payload: FormItemMutationPayload
  ) {
    return this.client.updateFormItem(tenantId, itemId, payload);
  }

  @Delete('tenants/:tenantId/form-items/:itemId')
  @TenantRoles('TENANT_ADMIN')
  deleteFormItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string
  ) {
    return this.client.deleteFormItem(tenantId, itemId);
  }

  @Put('tenants/:tenantId/form-sections/:sectionId/item-order')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createConcept(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: Required<ConceptMutationPayload>
  ) {
    return this.client.createConcept(tenantId, payload);
  }

  @Patch('tenants/:tenantId/concepts/:conceptId')
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
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
  @TenantRoles('TENANT_ADMIN')
  createAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() payload: Required<AssetMutationPayload>
  ) {
    return this.client.createAsset(tenantId, siteId, payload);
  }

  @Patch('tenants/:tenantId/sites/:siteId/assets/:assetId')
  @TenantRoles('TENANT_ADMIN')
  updateAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() payload: AssetMutationPayload
  ) {
    return this.client.updateAsset(tenantId, siteId, assetId, payload);
  }

  @Delete('tenants/:tenantId/sites/:siteId/assets/:assetId')
  @TenantRoles('TENANT_ADMIN')
  deleteAsset(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string
  ) {
    return this.client.deleteAsset(tenantId, siteId, assetId);
  }
}
