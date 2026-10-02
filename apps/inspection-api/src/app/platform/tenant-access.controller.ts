import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller('access/users/:userId/tenants')
export class TenantAccessController {
  constructor(private readonly platform: PlatformService) {}

  @Get()
  listAccessibleTenants(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.platform.listAccessibleTenants(userId);
  }

  @Get(':tenantId')
  async hasTenantAccess(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string
  ) {
    const membership = await this.platform.getTenantAccess(userId, tenantId);
    return {
      hasAccess: Boolean(membership),
      role: membership?.role ?? null,
    };
  }
}
