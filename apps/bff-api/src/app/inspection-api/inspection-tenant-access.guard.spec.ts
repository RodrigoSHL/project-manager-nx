import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../user-api/user-api.client';
import type { InspectionApiClient } from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';

describe('InspectionTenantAccessGuard', () => {
  const client = { hasTenantAccess: jest.fn() };
  const guard = new InspectionTenantAccessGuard(
    client as unknown as InspectionApiClient
  );

  beforeEach(() => client.hasTenantAccess.mockReset());

  it('allows a global administrator for every tenant', async () => {
    await expect(
      guard.canActivate(context([UserRole.ADMIN], 'tenant-1'))
    ).resolves.toBe(true);
    expect(client.hasTenantAccess).not.toHaveBeenCalled();
  });

  it('allows a user with an active tenant membership', async () => {
    client.hasTenantAccess.mockResolvedValue({ hasAccess: true });

    await expect(
      guard.canActivate(context([UserRole.USER], 'tenant-1'))
    ).resolves.toBe(true);
    expect(client.hasTenantAccess).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('rejects a user without tenant access', async () => {
    client.hasTenantAccess.mockResolvedValue({ hasAccess: false });

    await expect(
      guard.canActivate(context([UserRole.USER], 'tenant-2'))
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  function context(roles: UserRole[], tenantId?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            userId: 'user-1',
            email: 'user@example.com',
            name: 'User',
            roles,
          },
          params: tenantId ? { tenantId } : {},
        }),
      }),
    } as ExecutionContext;
  }
});
