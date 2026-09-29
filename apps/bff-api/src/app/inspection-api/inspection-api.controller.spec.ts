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
    createWork: jest.fn(),
    analytics: jest.fn(),
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

  it('keeps analytics behind the same JWT and tenant membership guards', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InspectionApiController)
    ).toEqual([JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard]);
    expect(
      Reflect.getMetadata(
        'path',
        InspectionApiController.prototype.analyticsSummary
      )
    ).toBe('tenants/:tenantId/analytics/summary');
  });

  it('forwards only the membership-verified tenant and rejects a mismatched route', () => {
    const request = {
      user: {
        userId: 'user-1',
        name: 'User',
        email: 'user@example.com',
        roles: [UserRole.USER],
      },
      tenantAccess: { tenantId: 'verified-tenant', role: 'VIEWER' },
    } as unknown as ExpressRequestWithUser;
    expect(() =>
      controller.analyticsSummary('route-tenant', {}, request)
    ).toThrow('Tenant access denied');
    controller.analyticsSummary('verified-tenant', {}, request);
    expect(client.analytics).toHaveBeenCalledWith(
      'verified-tenant',
      'summary',
      {}
    );
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
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.pushSync
      )
    ).toEqual(['TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR']);
    expect(
      Reflect.getMetadata(
        TENANT_ROLES_KEY,
        InspectionApiController.prototype.pullSync
      )
    ).toEqual(['TENANT_ADMIN', 'SUPERVISOR', 'INSPECTOR', 'VIEWER']);
  });

  it('reserves finding review for supervisors and tenant administrators', () => {
    for (const method of [
      'confirmFinding',
      'discardCandidate',
      'finalizeReview',
    ] as const) {
      expect(
        Reflect.getMetadata(
          TENANT_ROLES_KEY,
          InspectionApiController.prototype[method]
        )
      ).toEqual(['TENANT_ADMIN', 'SUPERVISOR']);
    }
  });

  it('uses the authenticated user name as the work responsible', () => {
    const payload = {
      workTypeId: 'work-type-1',
      title: 'Inspección visual',
      executionDate: '2026-09-27',
      responsible: 'Nombre enviado por el cliente',
      status: 'DRAFT' as const,
    };

    controller.createWork(
      'tenant-1',
      'site-1',
      'asset-1',
      request([UserRole.USER]),
      payload
    );

    expect(client.createWork).toHaveBeenCalledWith(
      'tenant-1',
      'site-1',
      'asset-1',
      expect.objectContaining({ responsible: 'User' })
    );
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
