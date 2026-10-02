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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserApiClient, UserRole } from '../user-api/user-api.client';
import {
  InspectionApiClient,
  TenantMembershipMutationPayload,
  TenantMutationPayload,
} from './inspection-api.client';

@Controller('api/platform/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PlatformAdminController {
  constructor(
    private readonly client: InspectionApiClient,
    private readonly users: UserApiClient
  ) {}

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

  @Get(':tenantId/users')
  async listTenantUsers(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string
  ) {
    const [users, memberships] = await Promise.all([
      this.users.findAllUsers(),
      this.client.listTenantMemberships(tenantId),
    ]);
    const membershipByUser = new Map(
      memberships.map((membership) => [membership.userId, membership])
    );
    return users.map((user) => ({
      ...user,
      hasAccess: membershipByUser.has(user.id),
      membershipRole: membershipByUser.get(user.id)?.role ?? null,
    }));
  }

  @Put(':tenantId/users/:userId/access')
  async grantTenantAccess(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() payload: TenantMembershipMutationPayload = {}
  ) {
    await this.users.findOneUser(userId);
    return this.client.grantTenantAccess(tenantId, userId, payload);
  }

  @Delete(':tenantId/users/:userId/access')
  revokeTenantAccess(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string
  ) {
    return this.client.revokeTenantAccess(tenantId, userId);
  }
}
