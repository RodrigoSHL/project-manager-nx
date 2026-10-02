import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../user-api/user-api.client';
import type { TenantRole } from './tenant-role';
import { TenantRolesGuard } from './tenant-roles.guard';

describe('TenantRolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new TenantRolesGuard(reflector as unknown as Reflector);

  beforeEach(() => reflector.getAllAndOverride.mockReset());

  it('allows the required role inside the selected tenant', () => {
    reflector.getAllAndOverride.mockReturnValue(['TENANT_ADMIN']);

    expect(guard.canActivate(context([UserRole.USER], 'TENANT_ADMIN'))).toBe(
      true
    );
  });

  it('keeps a viewer membership read-only', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'INSPECTOR',
    ]);

    expect(() => guard.canActivate(context([UserRole.USER], 'VIEWER'))).toThrow(
      ForbiddenException
    );
  });

  it('allows a global administrator independently of tenant role', () => {
    reflector.getAllAndOverride.mockReturnValue(['TENANT_ADMIN']);

    expect(guard.canActivate(context([UserRole.ADMIN]))).toBe(true);
  });

  function context(roles: UserRole[], role?: TenantRole) {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            userId: 'user-1',
            email: 'user@example.com',
            name: 'User',
            roles,
          },
          tenantAccess: role ? { tenantId: 'tenant-1', role } : undefined,
        }),
      }),
    } as ExecutionContext;
  }
});
