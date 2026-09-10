import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { AssetEntity } from '../catalog/entities/asset.entity';
import type { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import type { WorkEntity } from '../works/entities/work.entity';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  const tenantId = 'b9b2ca85-d07f-48da-a895-ed99af1fd7e2';
  let tenants: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let sites: { count: jest.Mock };
  let assets: { count: jest.Mock };
  let works: { count: jest.Mock };
  let service: PlatformService;

  beforeEach(() => {
    tenants = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value as TenantEntity),
      save: jest.fn(async (value) => value as TenantEntity),
    };
    sites = { count: jest.fn().mockResolvedValue(2) };
    assets = { count: jest.fn().mockResolvedValue(18) };
    works = { count: jest.fn().mockResolvedValue(5) };
    service = new PlatformService(
      tenants as unknown as Repository<TenantEntity>,
      sites as unknown as Repository<SiteEntity>,
      assets as unknown as Repository<AssetEntity>,
      works as unknown as Repository<WorkEntity>
    );
  });

  it('creates an active tenant with normalized values and usage counters', async () => {
    const saved = tenant('MINERA_NUEVA', 'Minera Nueva');
    tenants.create.mockReturnValue(saved);
    tenants.save.mockResolvedValue(saved);

    await expect(
      service.createTenant({ code: '  MINERA_NUEVA  ', name: ' Minera Nueva ' })
    ).resolves.toMatchObject({
      code: 'MINERA_NUEVA',
      name: 'Minera Nueva',
      active: true,
      siteCount: 2,
      assetCount: 18,
      workCount: 5,
    });
    expect(tenants.create).toHaveBeenCalledWith({
      code: 'MINERA_NUEVA',
      name: 'Minera Nueva',
      active: true,
    });
  });

  it('deactivates a tenant without deleting its operational data', async () => {
    const current = tenant('MINERA_NUEVA', 'Minera Nueva');
    tenants.findOne.mockResolvedValue(current);

    await expect(
      service.updateTenant(tenantId, { active: false })
    ).resolves.toMatchObject({ active: false, assetCount: 18 });
    expect(tenants.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: tenantId, active: false })
    );
  });

  it('rejects updates for a tenant that does not exist', async () => {
    tenants.findOne.mockResolvedValue(null);

    await expect(
      service.updateTenant(tenantId, { name: 'Inexistente' })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tenants.save).not.toHaveBeenCalled();
  });

  function tenant(code: string, name: string): TenantEntity {
    return {
      id: tenantId,
      code,
      name,
      active: true,
      createdAt: new Date('2026-09-10T12:00:00Z'),
      updatedAt: new Date('2026-09-10T12:00:00Z'),
    };
  }
});
