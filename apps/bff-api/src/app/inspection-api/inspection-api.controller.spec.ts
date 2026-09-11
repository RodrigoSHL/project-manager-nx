import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import type { InspectionApiClient } from './inspection-api.client';
import { InspectionApiController } from './inspection-api.controller';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';

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
    ).toEqual([JwtAuthGuard, InspectionTenantAccessGuard, RolesGuard]);
  });

  it('reserves catalog mutations for a global administrator', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        InspectionApiController.prototype.createAssetType
      )
    ).toEqual([UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        InspectionApiController.prototype.createAsset
      )
    ).toEqual([UserRole.ADMIN]);
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
