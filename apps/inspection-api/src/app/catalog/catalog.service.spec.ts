import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetEntity, AssetStatus } from './entities/asset.entity';
import { AssetTypeEntity } from './entities/asset-type.entity';
import { AssetTypeWorkTypeEntity } from './entities/asset-type-work-type.entity';
import { AssetWorkTypeEntity } from './entities/asset-work-type.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';
import { WorkTypeEntity } from './entities/work-type.entity';
import { ConceptEntity } from './entities/concept.entity';
import { ConceptOptionEntity } from './entities/concept-option.entity';
import { AssetTypeConceptEntity } from './entities/asset-type-concept.entity';

describe('CatalogService tenant isolation', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const siteId = '5178921c-1a4c-5f49-91f8-3b77b70d36bc';
  const assetId = 'b7c51f1b-4cf5-5689-9452-a4ad4736ca92';
  const assetTypeId = '968e4f5f-7611-5c70-bb42-9c0fe1935585';
  let tenantRepository: jest.Mocked<
    Pick<Repository<TenantEntity>, 'find' | 'exist'>
  >;
  let siteRepository: jest.Mocked<
    Pick<Repository<SiteEntity>, 'find' | 'exist'>
  >;
  let assetRepository: jest.Mocked<
    Pick<
      Repository<AssetEntity>,
      'find' | 'findOne' | 'create' | 'save' | 'remove'
    >
  >;
  let assetTypeRepository: jest.Mocked<
    Pick<Repository<AssetTypeEntity>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let workTypeRepository: jest.Mocked<
    Pick<Repository<WorkTypeEntity>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let assetTypeWorkTypeRepository: jest.Mocked<
    Pick<
      Repository<AssetTypeWorkTypeEntity>,
      'find' | 'findOne' | 'create' | 'save' | 'delete'
    >
  >;
  let assetWorkTypeRepository: jest.Mocked<
    Pick<
      Repository<AssetWorkTypeEntity>,
      'find' | 'findOne' | 'create' | 'save' | 'delete'
    >
  >;
  let conceptRepository: jest.Mocked<
    Pick<Repository<ConceptEntity>, 'find' | 'findOne'>
  >;
  let conceptOptionRepository: jest.Mocked<
    Pick<Repository<ConceptOptionEntity>, 'find'>
  >;
  let assetTypeConceptRepository: jest.Mocked<
    Pick<
      Repository<AssetTypeConceptEntity>,
      'find' | 'findOne' | 'count' | 'create' | 'save'
    >
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
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    assetTypeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    workTypeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    assetTypeWorkTypeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    assetWorkTypeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    conceptRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    conceptOptionRepository = {
      find: jest.fn(),
    };
    assetTypeConceptRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new CatalogService(
      tenantRepository as unknown as Repository<TenantEntity>,
      siteRepository as unknown as Repository<SiteEntity>,
      assetRepository as unknown as Repository<AssetEntity>,
      assetTypeRepository as unknown as Repository<AssetTypeEntity>,
      workTypeRepository as unknown as Repository<WorkTypeEntity>,
      assetTypeWorkTypeRepository as unknown as Repository<AssetTypeWorkTypeEntity>,
      assetWorkTypeRepository as unknown as Repository<AssetWorkTypeEntity>,
      conceptRepository as unknown as Repository<ConceptEntity>,
      conceptOptionRepository as unknown as Repository<ConceptOptionEntity>,
      assetTypeConceptRepository as unknown as Repository<AssetTypeConceptEntity>,
      {} as DataSource
    );
  });

  it('exposes only active tenants to operational selectors', async () => {
    tenantRepository.find.mockResolvedValue([]);

    await service.listTenants();

    expect(tenantRepository.find).toHaveBeenCalledWith({
      where: { active: true },
      order: { name: 'ASC' },
    });
  });

  it('lists concepts and options only for the requested tenant', async () => {
    const conceptId = '7bc82434-a111-4db6-b37e-f771945cadde';
    tenantRepository.exist.mockResolvedValue(true);
    conceptRepository.find.mockResolvedValue([
      { id: conceptId, tenantId, name: 'Temperatura' } as ConceptEntity,
    ]);
    conceptOptionRepository.find.mockResolvedValue([
      {
        id: 'e5ad4279-2c3b-47b7-995c-eb7a4c20db68',
        tenantId,
        conceptId,
        value: 'NORMAL',
        label: 'Normal',
        order: 1,
        active: true,
      } as ConceptOptionEntity,
    ]);

    const result = await service.listConcepts(tenantId);

    expect(conceptRepository.find).toHaveBeenCalledWith({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    expect(conceptOptionRepository.find).toHaveBeenCalledWith({
      where: { tenantId },
      order: { conceptId: 'ASC', order: 'ASC' },
    });
    expect(result[0].options).toHaveLength(1);
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

  it('creates a root asset only as a substation', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetTypeRepository.findOne.mockResolvedValue({
      id: assetTypeId,
      tenantId,
      code: 'SUBSTATION',
      active: true,
    } as AssetTypeEntity);
    const dto: CreateAssetDto = {
      code: 'SE-NEW',
      name: 'Nueva subestación',
      assetTypeId,
      parentId: null,
      status: AssetStatus.ACTIVE,
      description: null,
    };
    const created = { ...dto, tenantId, siteId, id: assetId } as AssetEntity;
    assetRepository.create.mockReturnValue(created);
    assetRepository.save.mockResolvedValue(created);

    await expect(service.createAsset(tenantId, siteId, dto)).resolves.toBe(
      created
    );
    expect(assetRepository.create).toHaveBeenCalledWith({
      tenantId,
      siteId,
      code: 'SE-NEW',
      name: 'Nueva subestación',
      assetTypeId,
      parentId: null,
      status: AssetStatus.ACTIVE,
      description: null,
    });
  });

  it('rejects a parent from another tenant or site', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.findOne.mockResolvedValue(null);
    const dto: CreateAssetDto = {
      code: 'TR-NEW',
      name: 'Nuevo transformador',
      assetTypeId,
      parentId: assetId,
      status: AssetStatus.ACTIVE,
      description: null,
    };

    await expect(
      service.createAsset(tenantId, siteId, dto)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(assetRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an asset type from another tenant', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetTypeRepository.findOne.mockResolvedValue(null);
    const dto: CreateAssetDto = {
      code: 'TR-NEW',
      name: 'Nuevo transformador',
      assetTypeId,
      parentId: null,
      status: AssetStatus.ACTIVE,
      description: null,
    };

    await expect(
      service.createAsset(tenantId, siteId, dto)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(assetTypeRepository.findOne).toHaveBeenCalledWith({
      where: { id: assetTypeId, tenantId },
    });
    expect(assetRepository.create).not.toHaveBeenCalled();
  });

  it('lists effective work types using asset rules before type rules', async () => {
    const visualId = '2cc9f8a4-8a68-5cd8-91b7-88dfc07cd4ea';
    const thermographyId = 'a52e6cb3-a8a4-530f-8c10-3d89c0b170ff';
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.findOne.mockResolvedValue({
      id: assetId,
      tenantId,
      siteId,
      assetTypeId,
    } as AssetEntity);
    workTypeRepository.find.mockResolvedValue([
      {
        id: visualId,
        tenantId,
        name: 'Inspección visual',
        active: true,
      } as WorkTypeEntity,
      {
        id: thermographyId,
        tenantId,
        name: 'Termografía',
        active: true,
      } as WorkTypeEntity,
    ]);
    assetTypeWorkTypeRepository.find.mockResolvedValue([
      {
        tenantId,
        assetTypeId,
        workTypeId: visualId,
        enabled: true,
      } as AssetTypeWorkTypeEntity,
      {
        tenantId,
        assetTypeId,
        workTypeId: thermographyId,
        enabled: true,
      } as AssetTypeWorkTypeEntity,
    ]);
    assetWorkTypeRepository.find.mockResolvedValue([
      {
        tenantId,
        assetId,
        workTypeId: thermographyId,
        enabled: false,
      } as AssetWorkTypeEntity,
    ]);

    await expect(
      service.listEffectiveWorkTypes(tenantId, siteId, assetId)
    ).resolves.toEqual([
      expect.objectContaining({ id: visualId, source: 'ASSET_TYPE' }),
    ]);
    expect(assetWorkTypeRepository.find).toHaveBeenCalledWith({
      where: { tenantId, assetId },
    });
    expect(assetTypeWorkTypeRepository.find).toHaveBeenCalledWith({
      where: { tenantId, assetTypeId },
    });
  });

  it('creates a tenant-scoped work type and normalizes its code', async () => {
    tenantRepository.exist.mockResolvedValue(true);
    const created = {
      id: '5bd2a420-f07a-43be-8d26-36d1b1ff4607',
      tenantId,
      code: 'OIL_ANALYSIS',
      name: 'Análisis de aceite',
      description: null,
      active: true,
    } as WorkTypeEntity;
    workTypeRepository.create.mockReturnValue(created);
    workTypeRepository.save.mockResolvedValue(created);

    await expect(
      service.createWorkType(tenantId, {
        code: 'oil-analysis',
        name: ' Análisis de aceite ',
        description: null,
        active: true,
      })
    ).resolves.toBe(created);
    expect(workTypeRepository.create).toHaveBeenCalledWith({
      tenantId,
      code: 'OIL_ANALYSIS',
      name: 'Análisis de aceite',
      description: null,
      active: true,
    });
  });

  it('rejects an association with a work type from another tenant', async () => {
    assetTypeRepository.findOne.mockResolvedValue({
      id: assetTypeId,
      tenantId,
      active: true,
    } as AssetTypeEntity);
    workTypeRepository.findOne.mockResolvedValue(null);

    await expect(
      service.associateAssetTypeWorkType(
        tenantId,
        assetTypeId,
        'bbdd797b-41b4-41fd-912a-c97037e5eef1'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assetTypeWorkTypeRepository.save).not.toHaveBeenCalled();
  });

  it('creates an asset-specific blocking override', async () => {
    const workTypeId = 'bbdd797b-41b4-41fd-912a-c97037e5eef1';
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.findOne.mockResolvedValue({
      id: assetId,
      tenantId,
      siteId,
      assetTypeId,
    } as AssetEntity);
    workTypeRepository.findOne.mockResolvedValue({
      id: workTypeId,
      tenantId,
      active: true,
    } as WorkTypeEntity);
    const rule = {
      tenantId,
      assetId,
      workTypeId,
      enabled: false,
    } as AssetWorkTypeEntity;
    assetWorkTypeRepository.findOne.mockResolvedValue(null);
    assetWorkTypeRepository.create.mockReturnValue(rule);
    assetWorkTypeRepository.save.mockResolvedValue(rule);

    await expect(
      service.setAssetWorkTypeOverride(
        tenantId,
        siteId,
        assetId,
        workTypeId,
        false
      )
    ).resolves.toEqual({ assetId, workTypeId, override: false });
    expect(assetWorkTypeRepository.create).toHaveBeenCalledWith({
      tenantId,
      assetId,
      workTypeId,
      enabled: false,
    });
  });

  it('prevents deleting an asset that has children', async () => {
    siteRepository.exist.mockResolvedValue(true);
    assetRepository.findOne
      .mockResolvedValueOnce({ id: assetId } as AssetEntity)
      .mockResolvedValueOnce({ id: 'child-id' } as AssetEntity);

    await expect(
      service.deleteAsset(tenantId, siteId, assetId)
    ).rejects.toBeInstanceOf(ConflictException);
    expect(assetRepository.remove).not.toHaveBeenCalled();
  });
});
