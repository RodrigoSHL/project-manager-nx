import { ExecutionContext, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { TenantEntity } from '../entities/tenant.entity';
import { ActiveTenantGuard } from './active-tenant.guard';

describe('ActiveTenantGuard', () => {
  const tenantId = 'b9b2ca85-d07f-48da-a895-ed99af1fd7e2';

  it('allows an active tenant', async () => {
    const tenants = { exist: jest.fn().mockResolvedValue(true) };
    const guard = new ActiveTenantGuard(
      tenants as unknown as Repository<TenantEntity>
    );

    await expect(guard.canActivate(context(tenantId))).resolves.toBe(true);
    expect(tenants.exist).toHaveBeenCalledWith({
      where: { id: tenantId, active: true },
    });
  });

  it('hides an inactive or unknown tenant', async () => {
    const tenants = { exist: jest.fn().mockResolvedValue(false) };
    const guard = new ActiveTenantGuard(
      tenants as unknown as Repository<TenantEntity>
    );

    await expect(guard.canActivate(context(tenantId))).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  function context(id?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ params: id ? { tenantId: id } : {} }),
      }),
    } as ExecutionContext;
  }
});
