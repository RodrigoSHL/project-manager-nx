import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
}
