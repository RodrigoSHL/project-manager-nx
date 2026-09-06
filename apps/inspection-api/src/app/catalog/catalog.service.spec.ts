import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { AssetEntity } from './entities/asset.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';

describe('CatalogService tenant isolation', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const siteId = '5178921c-1a4c-5f49-91f8-3b77b70d36bc';
  const assetId = 'b7c51f1b-4cf5-5689-9452-a4ad4736ca92';
  let tenantRepository: jest.Mocked<
    Pick<Repository<TenantEntity>, 'find' | 'exist'>
  >;
  let siteRepository: jest.Mocked<
    Pick<Repository<SiteEntity>, 'find' | 'exist'>
  >;
  let assetRepository: jest.Mocked<
    Pick<Repository<AssetEntity>, 'find' | 'findOne'>
  >;
  let service: CatalogService;

  beforeEach(() => {
    tenantRepository = {
      find: jest.fn(),
      exist: jest.fn(),
    };
    siteRepository = {
      find: jest.fn(),
      exist: jest.fn(),
    };
    assetRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CatalogService(
      tenantRepository as unknown as Repository<TenantEntity>,
      siteRepository as unknown as Repository<SiteEntity>,
      assetRepository as unknown as Repository<AssetEntity>
    );
  });

  it('queries assets using both tenantId and siteId', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.find.mockResolvedValue([]);

    await service.listAssets(tenantId, siteId);

    expect(siteRepository.exist).toHaveBeenCalledWith({
      where: { id: siteId, tenantId },
    });
    expect(assetRepository.find).toHaveBeenCalledWith({
      where: { tenantId, siteId },
      order: { code: 'ASC' },
    });
  });

  it('rejects a site that does not belong to the tenant', async () => {
    siteRepository.exist.mockResolvedValue(false);

    await expect(service.listAssets(tenantId, siteId)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(assetRepository.find).not.toHaveBeenCalled();
  });

  it('does not return an asset outside the requested context', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getAsset(tenantId, siteId, assetId)
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assetRepository.findOne).toHaveBeenCalledWith({
      where: { id: assetId, tenantId, siteId },
    });
  });
});
