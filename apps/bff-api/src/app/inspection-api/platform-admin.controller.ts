import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user-api/user-api.client';
import {
  InspectionApiClient,
  TenantMutationPayload,
} from './inspection-api.client';

@Controller('api/platform/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PlatformAdminController {
  constructor(private readonly client: InspectionApiClient) {}

  @Get()
  listTenants() {
    return this.client.listPlatformTenants();
  }

  @Get(':tenantId')
  getTenant(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.client.getPlatformTenant(tenantId);
  }

  @Post()
  createTenant(@Body() payload: Required<TenantMutationPayload>) {
    return this.client.createPlatformTenant(payload);
  }

  @Patch(':tenantId')
  updateTenant(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() payload: TenantMutationPayload
  ) {
    return this.client.updatePlatformTenant(tenantId, payload);
  }
}
