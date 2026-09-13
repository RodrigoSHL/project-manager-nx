import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import type { InspectionApiClient } from './inspection-api.client';
import { InspectionApiController } from './inspection-api.controller';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { TENANT_ROLES_KEY } from './tenant-roles.decorator';
import { TenantRolesGuard } from './tenant-roles.guard';

describe('InspectionApiController authorization', () => {
  const client = {
    listTenants: jest.fn(),
    listAccessibleTenants: jest.fn(),
  };
  const controller = new InspectionApiController(
    client as unknown as InspectionApiClient
  );

  beforeEach(() => jest.clearAllMocks());

  it('requires authentication and tenant access for operational routes', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InspectionApiController)
    ).toEqual([JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard]);
  });

  it('reserves catalog mutations for a tenant administrator', () => {
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.createSite
      )
    ).toEqual(['TENANT_ADMIN']);
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.createAssetType
      )
    ).toEqual(['TENANT_ADMIN']);
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.createAsset
      )
    ).toEqual(['TENANT_ADMIN']);
  });

  it('allows inspectors and supervisors to execute work mutations', () => {
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.createWork
      )
    ).toEqual(['TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR']);
  });

  it('lists every tenant for a global administrator', () => {
    controller.listTenants(request([UserRole.ADMIN]));
    expect(client.listTenants).toHaveBeenCalled();
    expect(client.listAccessibleTenants).not.toHaveBeenCalled();
  });

  it('lists only assigned tenants for an operational user', () => {
    controller.listTenants(request([UserRole.USER]));
    expect(client.listAccessibleTenants).toHaveBeenCalledWith('user-1');
    expect(client.listTenants).not.toHaveBeenCalled();
  });

  it('lists only administrable tenants for a tenant administrator', async () => {
    client.listAccessibleTenants.mockResolvedValue([
      { id: 'tenant-1', membershipRole: 'TENANT_ADMIN' },
      { id: 'tenant-2', membershipRole: 'INSPECTOR' },
    ]);

    await expect(
      controller.listAdministrableTenants(request([UserRole.USER]))
    ).resolves.toEqual([{ id: 'tenant-1', membershipRole: 'TENANT_ADMIN' }]);
  });

  function request(roles: UserRole[]): ExpressRequestWithUser {
    return {
      user: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User',
        roles,
      },
    } as ExpressRequestWithUser;
  }
});
