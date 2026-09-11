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
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PlatformService } from './platform.service';

@Controller('platform/tenants')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get()
  listTenants() {
    return this.platform.listTenants();
  }

  @Get(':tenantId')
  getTenant(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.platform.getTenant(tenantId);
  }

  @Post()
  createTenant(@Body() dto: CreateTenantDto) {
    return this.platform.createTenant(dto);
  }

  @Patch(':tenantId')
  updateTenant(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: UpdateTenantDto
  ) {
    return this.platform.updateTenant(tenantId, dto);
  }

  @Get(':tenantId/memberships')
  listMemberships(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.platform.listTenantMemberships(tenantId);
  }

  @Put(':tenantId/memberships/:userId')
  grantAccess(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string
  ) {
    return this.platform.grantTenantAccess(tenantId, userId);
  }

  @Delete(':tenantId/memberships/:userId')
  revokeAccess(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string
  ) {
    return this.platform.revokeTenantAccess(tenantId, userId);
  }
}
